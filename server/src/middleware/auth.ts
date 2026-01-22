import { Request, Response, NextFunction } from 'express';
import { JWTPayload } from '../types/index';
import { authService } from '../services/auth.service';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Nicht autorisiert. Bitte melden Sie sich an.' });
    return;
  }

  try {
    const decoded = await authService.validateToken(token);
    
    if (!decoded) {
      res.status(401).json({ error: 'Session abgelaufen oder ungültig. Bitte erneut anmelden.' });
      return;
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Token ungültig oder abgelaufen.' });
  }
};
