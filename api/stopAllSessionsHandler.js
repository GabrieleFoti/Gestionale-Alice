import ddbDocClient from './db.js';
import { ScanCommand, QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { finalizeCarAfterStop } from './services/workSessionService.js';

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'PanzaniDesign';
const CAR_PK_PREFIX = 'CAR#';

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

  // Aggiorna totalMinutes e status di ogni macchina coinvolta
  for (const carId of carIds) {
    const { Items: allSessions = [] } = await ddbDocClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :carPk',
      ExpressionAttributeValues: { ':carPk': `${CAR_PK_PREFIX}${carId}` },
    }));
    await finalizeCarAfterStop(carId, allSessions, closedDurationMap);
  }

  console.log(`Fermate ${activeSessions.length} lavorazioni su ${carIds.length} macchine.`);
  return { stopped: activeSessions.length, cars: carIds.length };
};
