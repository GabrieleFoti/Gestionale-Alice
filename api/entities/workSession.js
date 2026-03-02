// Single Table Design Constants
import { CAR_PK_PREFIX } from './car.js';

export const SESSION_PK_PREFIX = 'SESSION#';
export const SESSION_SK_PREFIX = 'METADATA#';

export const toSessionItem = (session) => ({
  PK: `${SESSION_PK_PREFIX}${session.id || Date.now()}`,
  SK: SESSION_SK_PREFIX,
  GSI1PK: `${CAR_PK_PREFIX}${session.carId}`, // To query all sessions for a car
  GSI1SK: session.startTime instanceof Date ? session.startTime.toISOString() : session.startTime,
  type: 'SESSION',
  ...session
});
