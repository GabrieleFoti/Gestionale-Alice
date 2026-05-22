import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be set');
}

export const authMiddleware = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return false;
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: payload.id,
      username: payload.username,
      role: payload.role || 'operator',
    };
    return true;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Token expired' });
    } else {
      res.status(401).json({ error: 'Invalid token' });
    }
    return false;
  }
};
