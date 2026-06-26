import ddbDocClient from '../db.js';
import { ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'PanzaniDesign';

const { Items: sessions = [] } = await ddbDocClient.send(new ScanCommand({
  TableName: TABLE_NAME,
  FilterExpression: '#t = :sessionType AND attribute_not_exists(GSI2PK)',
  ExpressionAttributeNames: { '#t': 'type' },
  ExpressionAttributeValues: { ':sessionType': 'SESSION' },
}));

console.log(`${sessions.length} sessioni da aggiornare`);

for (const session of sessions) {
  await ddbDocClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      ...session,
      GSI2PK: `OPERATOR#${session.operatorName}`,
      GSI2SK: session.startTime,
    },
  }));
  console.log(`✓ ${session.PK}`);
}

console.log('Backfill GSI2 completato.');
