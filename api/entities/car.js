// Single Table Design Constants
export const CAR_PK_PREFIX = 'CAR#';
export const CAR_SK_PREFIX = 'METADATA#';

export const toCarItem = (car) => ({
  PK: `${CAR_PK_PREFIX}${car.id || Date.now()}`,
  SK: CAR_SK_PREFIX,
  GSI1PK: 'CAR',
  GSI1SK: car.plate,
  type: 'CAR',
  ...car
});