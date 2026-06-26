import ddbDocClient from '../db.js';
import { ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const TABLE_NAME = 'PanzaniDesign';

const { Items: cars = [] } = await ddbDocClient.send(new ScanCommand({
  TableName: TABLE_NAME,
  FilterExpression: '#t = :carType AND attribute_exists(totalHours)',
  ExpressionAttributeNames: { '#t': 'type' },
  ExpressionAttributeValues: { ':carType': 'CAR' },
}));

console.log(`Trovate ${cars.length} macchine con totalHours da migrare.`);

for (const car of cars) {
  const raw = car.totalHours;

  if (typeof raw === 'number') {
    console.log(`✓ ${car.plate} già intero (${raw} min), skip`);
    continue;
  }

  const match = String(raw).match(/(\d+)h\s*(\d+)m/);
  if (!match) {
    console.warn(`⚠ ${car.plate} formato non riconosciuto: "${raw}", skip`);
    continue;
  }

  const totalMinutes = parseInt(match[1]) * 60 + parseInt(match[2]);

  await ddbDocClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { PK: car.PK, SK: car.SK },
    UpdateExpression: 'set totalMinutes = :tm REMOVE totalHours',
    ExpressionAttributeValues: { ':tm': totalMinutes },
  }));

  console.log(`✓ ${car.plate}: "${raw}" → ${totalMinutes} min`);
}

console.log('Migrazione totalHours completata.');
