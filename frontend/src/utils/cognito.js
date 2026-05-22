import { CognitoUserPool } from 'amazon-cognito-identity-js';

const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;

if (!userPoolId || !clientId) {
  throw new Error('VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_CLIENT_ID must be set');
}

const poolData = {
  UserPoolId: userPoolId,
  ClientId: clientId,
};

export const userPool = new CognitoUserPool(poolData);

export const getRegion = () => {
  const region = import.meta.env.VITE_AWS_REGION;
  if (!region) throw new Error('VITE_AWS_REGION must be set');
  return region;
};
