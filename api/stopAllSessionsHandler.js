import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, QueryCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-central-1' });
const ddbDocClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true, convertClassInstanceToMap: true },
});

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'PanzaniDesign';
const CAR_PK_PREFIX = 'CAR#';
const CAR_SK_PREFIX = 'METADATA#';

export const stopAllSessionsHandler = async () => {
  const scanResult = await ddbDocClient.send(new ScanCommand({
    TableName: TABLE_NAME,
    FilterExpression: '#t = :sessionType AND attribute_not_exists(endTime)',
    ExpressionAttributeNames: { '#t': 'type' },
    ExpressionAttributeValues: { ':sessionType': 'SESSION' },
  }));

  const activeSessions = scanResult.Items || [];

  if (activeSessions.length === 0) {
    console.log('Nessuna lavorazione attiva da fermare.');
    return { stopped: 0, cars: 0 };
  }

  const endTime = new Date().toISOString();
  const carIds = [...new Set(activeSessions.map(s => s.carId))];

  // Calcola le durate in memoria prima di scrivere sul DB
  const closedSessions = activeSessions.map(session => ({
    ...session,
    endTime,
    durationMinutes: Math.floor((new Date(endTime) - new Date(session.startTime)) / 60000),
  }));
  const closedDurationMap = new Map(closedSessions.map(s => [s.PK, s.durationMinutes]));

  // Chiude ogni sessione attiva
  for (const session of closedSessions) {
    await ddbDocClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: session,
    }));
  }

  // Aggiorna totalHours e status di ogni macchina coinvolta
  for (const carId of carIds) {
    // Recupera tutte le sessioni storiche (incluse quelle non attive)
    // per calcolare il totale corretto
    const { Items: allSessions = [] } = await ddbDocClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :carPk',
      ExpressionAttributeValues: { ':carPk': `${CAR_PK_PREFIX}${carId}` },
    }));

    // Usa le durate calcolate in memoria per le sessioni appena chiuse
    const totalMins = allSessions.reduce((acc, s) => {
      return acc + (closedDurationMap.has(s.PK) ? closedDurationMap.get(s.PK) : (s.durationMinutes || 0));
    }, 0);

    const totalHoursStr = `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`;

    await ddbDocClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `${CAR_PK_PREFIX}${carId}`, SK: CAR_SK_PREFIX },
      UpdateExpression: 'set totalHours = :th',
      ExpressionAttributeValues: { ':th': totalHoursStr },
    }));

    // Riporta la macchina a "waiting" (solo se non è già completata)
    try {
      await ddbDocClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: `${CAR_PK_PREFIX}${carId}`, SK: CAR_SK_PREFIX },
        UpdateExpression: 'set #s = :waiting',
        ConditionExpression: '#s <> :completed',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':waiting': 'waiting', ':completed': 'completed' },
      }));
    } catch (e) {
      if (e.name !== 'ConditionalCheckFailedException') throw e;
    }
  }

  console.log(`Fermate ${activeSessions.length} lavorazioni su ${carIds.length} macchine.`);
  return { stopped: activeSessions.length, cars: carIds.length };
};
