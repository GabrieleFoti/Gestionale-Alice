/**
 * Script per creare gli utenti iniziali su DynamoDB.
 *
 * Uso:
 *   DYNAMODB_TABLE_NAME=PanzaniDesign AWS_REGION=eu-south-1 node seed-users.js
 */

import bcrypt from 'bcryptjs';
import ddbDocClient from './db.js';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { toUserItem } from './entities/user.js';

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'PanzaniDesign';

const USERS = [
  {
    username: 'Alice',
    password: 'Zanganella23@',
    role: 'admin',
  },
  {
    username: 'Officine',
    password: '01Officina02!',
    role: 'operator',
  },
];

async function createUser({ username, password, role }) {
  const hashed = await bcrypt.hash(password, 10);
  const item = toUserItem({ username, password: hashed, role });

  await ddbDocClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: item,
    ConditionExpression: 'attribute_not_exists(PK)',
  }));

  console.log(`Utente "${username}" (role: ${role}) creato`);
}

async function main() {
  console.log(`Tabella: ${TABLE_NAME}\n`);
  for (const user of USERS) {
    try {
      await createUser(user);
    } catch (err) {
      if (err.name === 'ConditionalCheckFailedException') {
        console.log(`Utente "${user.username}" già esistente, salto`);
      } else {
        throw err;
      }
    }
  }
  console.log('\nFatto!');
}

main().catch((err) => {
  console.error('Errore:', err.message);
  process.exit(1);
});
