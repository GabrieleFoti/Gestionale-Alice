import ddbDocClient from '../db.js';
import { GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'PanzaniDesign';
const RATELIMIT_PREFIX = 'RATELIMIT#';
const RATELIMIT_SK = 'METADATA#';
const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 900; // 15 minuti

export async function checkRateLimit(username) {
  const { Item } = await ddbDocClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { PK: `${RATELIMIT_PREFIX}${username}`, SK: RATELIMIT_SK },
  }));

  if (!Item) return;
  if (Item.failCount >= MAX_ATTEMPTS && Item.ttl > Math.floor(Date.now() / 1000)) {
    const retryAfter = Item.ttl - Math.floor(Date.now() / 1000);
    const err = new Error(`Troppi tentativi. Riprova tra ${Math.ceil(retryAfter / 60)} minuti.`);
    err.statusCode = 429;
    throw err;
  }
}

export async function recordFailedAttempt(username) {
  const ttl = Math.floor(Date.now() / 1000) + WINDOW_SECONDS;
  await ddbDocClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { PK: `${RATELIMIT_PREFIX}${username}`, SK: RATELIMIT_SK },
    UpdateExpression: 'SET failCount = if_not_exists(failCount, :zero) + :one, #ttl = :ttl',
    ExpressionAttributeNames: { '#ttl': 'ttl' },
    ExpressionAttributeValues: { ':zero': 0, ':one': 1, ':ttl': ttl },
  }));
}

export async function clearRateLimit(username) {
  await ddbDocClient.send(new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { PK: `${RATELIMIT_PREFIX}${username}`, SK: RATELIMIT_SK },
  }));
}
