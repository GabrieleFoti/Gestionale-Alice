import { CognitoJwtVerifier } from 'aws-jwt-verify';

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || 'eu-north-1_3Om6xHC0B';
const CLIENT_ID = process.env.COGNITO_CLIENT_ID || '3ogm70rtra6t1gov1h8j7i14ot';

// Verifier per idToken Cognito
const verifier = CognitoJwtVerifier.create({
  userPoolId: USER_POOL_ID,
  tokenUse: 'id',
  clientId: CLIENT_ID,
});

/**
 * Middleware to verify Cognito ID token from Authorization header.
 * Attaches decoded user info to req.user if valid.
 */
export const authMiddleware = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return false;
  }

  const token = authHeader.substring(7);

  try {
    const payload = await verifier.verify(token);
    req.user = {
      id: payload.sub,
      username: payload['cognito:username'] || payload.email,
      email: payload.email,
      role: payload['custom:role'] || payload['cognito:groups']?.[0] || 'operator',
    };
    return true;
  } catch (error) {
    if (error.message?.includes('expired')) {
      res.status(401).json({ error: 'Token expired' });
    } else {
      res.status(401).json({ error: 'Invalid token' });
    }
    return false;
  }
};
