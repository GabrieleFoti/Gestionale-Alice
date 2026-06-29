import ddbDocClient from "../db.js";
import { PutCommand, GetCommand, QueryCommand, UpdateCommand, ScanCommand, TransactWriteCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { SESSION_PK_PREFIX, SESSION_SK_PREFIX, toSessionItem } from "../entities/workSession.js";
import { CAR_PK_PREFIX, CAR_SK_PREFIX } from "../entities/car.js";

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'PanzaniDesign';
const OPERATOR_PK_PREFIX = 'OPERATOR#';

// Aggiorna totalMinutes e status macchina dopo la chiusura di sessioni.
// allSessions: tutte le sessioni della macchina (dal DB, pre-write).
// closedDurationMap: Map<PK, durationMinutes> delle sessioni appena chiuse in memoria.
export async function finalizeCarAfterStop(carId, allSessions, closedDurationMap) {
  const totalMins = allSessions.reduce((acc, s) => {
    return acc + (closedDurationMap.has(s.PK) ? closedDurationMap.get(s.PK) : (s.durationMinutes || 0));
  }, 0);

  await ddbDocClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { PK: `${CAR_PK_PREFIX}${carId}`, SK: CAR_SK_PREFIX },
    UpdateExpression: 'set totalMinutes = :tm',
    ExpressionAttributeValues: { ':tm': totalMins },
  }));

  const remainingActive = allSessions.filter(s => !s.endTime && !closedDurationMap.has(s.PK));
  if (remainingActive.length === 0) {
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
}

export default function workSessionService() {
  async function getActiveByOperator(operatorName) {
    const data = await ddbDocClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :opPk',
      FilterExpression: 'attribute_not_exists(endTime)',
      ExpressionAttributeValues: { ':opPk': `${OPERATOR_PK_PREFIX}${operatorName}` },
    }));
    return data.Items || [];
  }

  async function getAllActive(req) {
    if (!req.user) throw new Error('User not logged in');
    const params = {
      TableName: TABLE_NAME,
      FilterExpression: 'attribute_not_exists(endTime) AND #t = :sessionType',
      ExpressionAttributeNames: { '#t': 'type' },
      ExpressionAttributeValues: { ':sessionType': 'SESSION' }
    };
    const data = await ddbDocClient.send(new ScanCommand(params));
    return data.Items || [];
  }

  async function start(req, carId, operatorName) {
    if(!req.user || !carId || !operatorName) {
      throw new Error('User not logged in or invalid parameters');
    }

    // Auto-stop any active session this operator has on a different car
    const operatorActiveSessions = await getActiveByOperator(operatorName);
    const otherCarSessions = operatorActiveSessions.filter(s => s.carId !== carId);
    const stoppedCars = [];
    for (const session of otherCarSessions) {
      await stop(req, session.carId, operatorName);
      stoppedCars.push(session.carId);
    }

    // Check if there is already an active session for this operator and car
    const params = {
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :carPk',
      FilterExpression: 'operatorName = :opName AND attribute_not_exists(endTime)',
      ExpressionAttributeValues: {
        ':carPk': `${CAR_PK_PREFIX}${carId}`,
        ':opName': operatorName
      }
    };

    const data = await ddbDocClient.send(new QueryCommand(params));
    if (data.Items && data.Items.length > 0) return { ...data.Items[0], stoppedCars };

    const session = toSessionItem({
      carId,
      operatorName,
      startTime: new Date().toISOString()
    });

    try {
      await ddbDocClient.send(new TransactWriteCommand({
        TransactItems: [
          { Put: { TableName: TABLE_NAME, Item: session } },
          {
            Update: {
              TableName: TABLE_NAME,
              Key: { PK: `${CAR_PK_PREFIX}${carId}`, SK: CAR_SK_PREFIX },
              UpdateExpression: 'set #s = :inProgress',
              ConditionExpression: '#s <> :completed',
              ExpressionAttributeNames: { '#s': 'status' },
              ExpressionAttributeValues: { ':inProgress': 'in_progress', ':completed': 'completed' },
            }
          }
        ]
      }));
    } catch (e) {
      if (e.name === 'TransactionCanceledException') {
        // La macchina è già completata — avvia la sessione senza aggiornare lo status
        await ddbDocClient.send(new PutCommand({ TableName: TABLE_NAME, Item: session }));
      } else {
        throw e;
      }
    }

    return { ...session, stoppedCars };
  }

  async function stop(req, carId, operatorName) {
    if(!req.user || !carId || !operatorName) {
      throw new Error('User not logged in or invalid parameters');
    }

    // Legge in parallelo: sessione attiva dell'operatore + tutte le sessioni della macchina
    // Le due query vengono fatte PRIMA di qualsiasi scrittura per avere dati consistenti
    const [activeData, allSessionsData] = await Promise.all([
      ddbDocClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :carPk',
        FilterExpression: 'operatorName = :opName AND attribute_not_exists(endTime)',
        ExpressionAttributeValues: {
          ':carPk': `${CAR_PK_PREFIX}${carId}`,
          ':opName': operatorName
        }
      })),
      ddbDocClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :carPk',
        ExpressionAttributeValues: { ':carPk': `${CAR_PK_PREFIX}${carId}` }
      })),
    ]);

    if (!activeData.Items || activeData.Items.length === 0) return null;

    const activeSession = activeData.Items[0];
    const endTime = new Date().toISOString();
    const durationMinutes = Math.floor((new Date(endTime) - new Date(activeSession.startTime)) / 60000);

    const allSessions = allSessionsData.Items || [];

    if (durationMinutes < 1) {
      // Sessione troppo breve: elimina dal DB senza contarla nei totali
      await ddbDocClient.send(new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { PK: activeSession.PK, SK: activeSession.SK }
      }));
      const closedDurationMap = new Map([[activeSession.PK, 0]]);
      await finalizeCarAfterStop(carId, allSessions, closedDurationMap);
      return null;
    }

    const closedSession = { ...activeSession, endTime, durationMinutes };

    await ddbDocClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: closedSession
    }));

    // Calcola totalMinutes e aggiorna status macchina (evita re-query GSI per eventual consistency)
    const closedDurationMap = new Map([[activeSession.PK, durationMinutes]]);
    await finalizeCarAfterStop(carId, allSessions, closedDurationMap);

    return closedSession;
  }

  async function getActive(req, carId) {
    if(!req.user || !carId) {
      throw new Error('User not logged in or invalid carId');
    }
    
    const params = {
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :carPk',
      FilterExpression: 'attribute_not_exists(endTime)',
      ExpressionAttributeValues: {
        ':carPk': `${CAR_PK_PREFIX}${carId}`
      }
    };

    const data = await ddbDocClient.send(new QueryCommand(params));
    return data.Items || [];
  }

  async function getByCar(req, carId) {
    if(!req.user || !carId) {
      throw new Error('User not logged in or invalid carId');
    }
    
    const params = {
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :carPk',
      ExpressionAttributeValues: {
        ':carPk': `${CAR_PK_PREFIX}${carId}`
      },
      ScanIndexForward: false // DESC order by SK (startTime)
    };

    const data = await ddbDocClient.send(new QueryCommand(params));
    return data.Items || [];
  }

  return {
    start,
    stop,
    getActive,
    getAllActive,
    getByCar
  };
}
