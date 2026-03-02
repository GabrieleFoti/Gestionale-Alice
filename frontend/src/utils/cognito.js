import { CognitoUserPool } from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'eu-north-1_3Om6xHC0B',
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '3ogm70rtra6t1gov1h8j7i14ot',
};

export const userPool = new CognitoUserPool(poolData);

export const getRegion = () => import.meta.env.VITE_AWS_REGION || 'eu-north-1';
