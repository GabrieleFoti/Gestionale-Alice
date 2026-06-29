/**
 * Elimina dal DB tutte le sessioni chiuse che durano meno di 1 minuto
 * e ricalcola i totalMinutes delle macchine coinvolte.
 *
 * Uso: node api/scripts/cleanup-short-sessions.js [--dry-run]
 */
import ddbDocClient from '../db.js';
import { ScanCommand, DeleteCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { CAR_PK_PREFIX, CAR_SK_PREFIX } from '../entities/car.js';

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'PanzaniDesign';
const DRY_RUN = process.argv.includes('--dry-run');

if (DRY_RUN) console.log('[DRY RUN] Nessuna modifica verrà applicata\n');

// 1. Trova tutte le sessioni chiuse con durationMinutes < 1
const { Items: shortSessions = [] } = await ddbDocClient.send(new ScanCommand({
  TableName: TABLE_NAME,
  FilterExpression: '#t = :sessionType AND attribute_exists(endTime) AND durationMinutes < :minDur',
  ExpressionAttributeNames: { '#t': 'type' },
  ExpressionAttributeValues: { ':sessionType': 'SESSION', ':minDur': 1 },
}));

console.log(`Trovate ${shortSessions.length} sessioni brevi (< 1 min) da eliminare\n`);

if (shortSessions.length === 0) {
  console.log('Niente da fare.');
  process.exit(0);
}

// 2. Raggruppa per carId per ricalcolare i totali dopo la cancellazione
const affectedCarIds = new Set(shortSessions.map(s => s.carId));

// 3. Elimina le sessioni brevi
for (const session of shortSessions) {
  const label = `${session.PK} | car=${session.carId} | op=${session.operatorName} | dur=${session.durationMinutes}min`;
  if (DRY_RUN) {
    console.log(`[DRY RUN] Eliminerei: ${label}`);
  } else {
    await ddbDocClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: session.PK, SK: session.SK },
    }));
    console.log(`✓ Eliminata: ${label}`);
  }
}

// 4. Ricalcola totalMinutes per ogni macchina coinvolta
console.log(`\nRicalcolo totalMinutes per ${affectedCarIds.size} macchine...\n`);

for (const carId of affectedCarIds) {
  const { Items: allSessions = [] } = await ddbDocClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :carPk',
    FilterExpression: 'attribute_exists(endTime)',
    ExpressionAttributeValues: { ':carPk': `${CAR_PK_PREFIX}${carId}` },
  }));

  const totalMinutes = allSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

  if (DRY_RUN) {
    console.log(`[DRY RUN] car=${carId} → totalMinutes sarebbe ${totalMinutes}`);
  } else {
    await ddbDocClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `${CAR_PK_PREFIX}${carId}`, SK: CAR_SK_PREFIX },
      UpdateExpression: 'set totalMinutes = :tm',
      ExpressionAttributeValues: { ':tm': totalMinutes },
    }));
    console.log(`✓ car=${carId} → totalMinutes=${totalMinutes}`);
  }
}

console.log('\nPulizia completata.');
