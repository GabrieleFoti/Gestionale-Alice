import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'alice-secret-key';

/**
 * Middleware to verify JWT token from Authorization header
 * Attaches decoded user info to req.user if valid
 */
export const authMiddleware = (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return false;
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user info to request
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
