import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';
import { validate, loginSchema } from '../middleware/validate';

const router = Router();

// Public routes
router.post('/login', validate(loginSchema), authController.login.bind(authController));
router.post('/logout', authController.logout.bind(authController));

// Protected routes
router.get('/me', authenticateToken, authController.me.bind(authController));
router.get('/sessions', authenticateToken, authController.getSessions.bind(authController));
router.post('/logout-all', authenticateToken, authController.logoutAll.bind(authController));
router.delete('/sessions/:sessionId', authenticateToken, authController.revokeSession.bind(authController));

export default router;
