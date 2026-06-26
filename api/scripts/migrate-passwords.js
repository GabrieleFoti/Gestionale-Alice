import ddbDocClient from '../db.js';
import { ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'PanzaniDesign';

const { Items: users = [] } = await ddbDocClient.send(new ScanCommand({
  TableName: TABLE_NAME,
  FilterExpression: '#t = :userType',
  ExpressionAttributeNames: { '#t': 'type' },
  ExpressionAttributeValues: { ':userType': 'USER' },
}));

console.log(`Trovati ${users.length} utenti.`);

for (const user of users) {
  // Salta utenti già migrati (hash bcrypt inizia con $2a$ o $2b$)
  if (user.password && user.password.startsWith('$2')) {
    console.log(`✓ ${user.username} già hashato, skip`);
    continue;
  }
  const hashed = await bcrypt.hash(user.password, 10);
  await ddbDocClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: { ...user, password: hashed },
  }));
  console.log(`✓ ${user.username} migrato`);
}

console.log('Migrazione password completata.');
