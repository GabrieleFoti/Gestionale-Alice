import ddbDocClient from "../db.js";
import { PutCommand, GetCommand, QueryCommand, UpdateCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { SESSION_PK_PREFIX, SESSION_SK_PREFIX, toSessionItem } from "../entities/workSession.js";
import { CAR_PK_PREFIX, CAR_SK_PREFIX } from "../entities/car.js";

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'PanzaniDesign';

export default function workSessionService() {
  async function getActiveByOperator(operatorName) {
    const params = {
      TableName: TABLE_NAME,
      FilterExpression: 'operatorName = :opName AND attribute_not_exists(endTime) AND #t = :sessionType',
      ExpressionAttributeNames: { '#t': 'type' },
      ExpressionAttributeValues: {
        ':opName': operatorName,
        ':sessionType': 'SESSION'
      }
    };
    const data = await ddbDocClient.send(new ScanCommand(params));
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

    await ddbDocClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: session
    }));

    // Porta la macchina in lavorazione (solo se non è già completata)
    try {
      await ddbDocClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: `${CAR_PK_PREFIX}${carId}`, SK: CAR_SK_PREFIX },
        UpdateExpression: 'set #s = :inProgress',
        ConditionExpression: '#s <> :completed',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':inProgress': 'in_progress', ':completed': 'completed' },
      }));
    } catch (e) {
      if (e.name !== 'ConditionalCheckFailedException') throw e;
    }

    return { ...session, stoppedCars };
  }

  async function stop(req, carId, operatorName) {
    if(!req.user || !carId || !operatorName) {
      throw new Error('User not logged in or invalid parameters');
    }
    
    // Find active session
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
    if (!data.Items || data.Items.length === 0) return null;

    const activeSession = data.Items[0];
    const endTime = new Date().toISOString();
    const startTime = new Date(activeSession.startTime);
    const durationMs = new Date(endTime) - startTime;
    const durationMinutes = Math.floor(durationMs / 60000);

    activeSession.endTime = endTime;
    activeSession.durationMinutes = durationMinutes;

    await ddbDocClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: activeSession
    }));

    // Update totalHours on Car
    const allSessionsParams = {
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :carPk',
      ExpressionAttributeValues: {
        ':carPk': `${CAR_PK_PREFIX}${carId}`
      }
    };
    const sessionsData = await ddbDocClient.send(new QueryCommand(allSessionsParams));
    const totalMins = (sessionsData.Items || []).reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    const totalHoursStr = `${h}h ${m}m`;

    await ddbDocClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `${CAR_PK_PREFIX}${carId}`,
        SK: CAR_SK_PREFIX
      },
      UpdateExpression: 'set totalHours = :th',
      ExpressionAttributeValues: {
        ':th': totalHoursStr
      }
    }));

    // Se non ci sono altre sessioni attive, riporta la macchina a waiting
    const remainingActive = (sessionsData.Items || []).filter(s =>
      !s.endTime && s.PK !== activeSession.PK
    );
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

    return activeSession;
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
