import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    username: string;
    role: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      username: string;
      role: string;
    };
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

export const authorizeAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ROLE_ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  next();
}; 