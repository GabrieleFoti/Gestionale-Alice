// Single Table Design Constants
export const USER_PK_PREFIX = 'USER#';
export const USER_SK_PREFIX = 'METADATA#';

export const toUserItem = (user) => ({
  PK: `${USER_PK_PREFIX}${user.username}`,
  SK: USER_SK_PREFIX,
  GSI1PK: 'USER',
  GSI1SK: user.username,
  type: 'USER',
  ...user
});