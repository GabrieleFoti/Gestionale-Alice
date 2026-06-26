// Single Table Design Constants
import { randomUUID } from 'crypto';
import { CAR_PK_PREFIX } from './car.js';

export const SESSION_PK_PREFIX = 'SESSION#';
export const SESSION_SK_PREFIX = 'METADATA#';
const OPERATOR_PK_PREFIX = 'OPERATOR#';

export const toSessionItem = (session) => {
  const startTime = session.startTime instanceof Date ? session.startTime.toISOString() : session.startTime;
  return {
    PK: `${SESSION_PK_PREFIX}${session.id || randomUUID()}`,
    SK: SESSION_SK_PREFIX,
    GSI1PK: `${CAR_PK_PREFIX}${session.carId}`,
    GSI1SK: startTime,
    GSI2PK: `${OPERATOR_PK_PREFIX}${session.operatorName}`,
    GSI2SK: startTime,
    type: 'SESSION',
    ...session,
  };
};
