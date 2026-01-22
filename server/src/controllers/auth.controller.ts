import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthenticatedRequest } from '../middleware/auth';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      
      // Get session info from request
      const sessionInfo = {
        deviceInfo: req.headers['user-agent'] || 'Unknown',
        ipAddress: req.ip || req.socket.remoteAddress || 'Unknown',
      };

      const { user, token } = await authService.login(email, password, sessionInfo);

      // Set HTTP-only cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      res.json({ user, token });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
      
      if (token) {
        await authService.logout(token);
      }

      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      
      res.json({ message: 'Erfolgreich abgemeldet.' });
    } catch (error) {
      next(error);
    }
  }

  async logoutAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Nicht autorisiert.' });
        return;
      }

      await authService.logoutAllSessions(req.user.userId);
      
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      res.json({ message: 'Von allen Geräten abgemeldet.' });
    } catch (error) {
      next(error);
    }
  }

  async me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Nicht autorisiert.' });
        return;
      }

      const user = await authService.getUserById(req.user.userId);
      if (!user) {
        res.status(404).json({ error: 'Benutzer nicht gefunden.' });
        return;
      }

      res.json({ user });
    } catch (error) {
      next(error);
    }
  }

  async getSessions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Nicht autorisiert.' });
        return;
      }

      const sessions = await authService.getActiveSessions(req.user.userId);
      res.json({ sessions });
    } catch (error) {
      next(error);
    }
  }

  async revokeSession(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Nicht autorisiert.' });
        return;
      }

      const { sessionId } = req.params;
      const success = await authService.revokeSession(req.user.userId, sessionId);

      if (!success) {
        res.status(404).json({ error: 'Session nicht gefunden.' });
        return;
      }

      res.json({ message: 'Session beendet.' });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
