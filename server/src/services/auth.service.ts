import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { User, JWTPayload } from '../types/index';
import { AppError } from '../middleware/errorHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '24h';
const MAX_SESSIONS_PER_USER = 3;

interface SessionInfo {
  deviceInfo?: string;
  ipAddress?: string;
}

export class AuthService {
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async login(
    email: string, 
    password: string, 
    sessionInfo?: SessionInfo
  ): Promise<{ user: Omit<User, 'password_hash'>; token: string }> {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      throw new AppError('Ungültige E-Mail oder Passwort.', 401);
    }

    const user = result.rows[0] as User;
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      throw new AppError('Ungültige E-Mail oder Passwort.', 401);
    }

    // Clean up expired sessions first
    await this.cleanupExpiredSessions(user.id);

    // Check active session count
    const activeSessions = await query(
      'SELECT COUNT(*) as count FROM sessions WHERE user_id = $1 AND expires_at > NOW()',
      [user.id]
    );
    
    const sessionCount = parseInt(activeSessions.rows[0].count, 10);
    
    // If at max sessions, remove the oldest one
    if (sessionCount >= MAX_SESSIONS_PER_USER) {
      await query(
        `DELETE FROM sessions 
         WHERE id = (
           SELECT id FROM sessions 
           WHERE user_id = $1 
           ORDER BY last_activity ASC 
           LIMIT 1
         )`,
        [user.id]
      );
    }

    const payload: JWTPayload = {
      userId: user.id,
      email: user.email
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const tokenHash = this.hashToken(token);

    // Create new session
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await query(
      `INSERT INTO sessions (id, user_id, token_hash, device_info, ip_address, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [sessionId, user.id, tokenHash, sessionInfo?.deviceInfo || null, sessionInfo?.ipAddress || null, expiresAt]
    );

    const { password_hash, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async logout(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    await query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash]);
  }

  async logoutAllSessions(userId: string): Promise<void> {
    await query('DELETE FROM sessions WHERE user_id = $1', [userId]);
  }

  async validateToken(token: string): Promise<JWTPayload | null> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      const tokenHash = this.hashToken(token);

      // Check if session exists and is valid
      const sessionResult = await query(
        'SELECT * FROM sessions WHERE token_hash = $1 AND expires_at > NOW()',
        [tokenHash]
      );

      if (sessionResult.rows.length === 0) {
        return null;
      }

      // Update last activity
      await query(
        'UPDATE sessions SET last_activity = NOW() WHERE token_hash = $1',
        [tokenHash]
      );

      return decoded;
    } catch {
      return null;
    }
  }

  async getUserById(userId: string): Promise<Omit<User, 'password_hash'> | null> {
    const result = await query(
      'SELECT id, email, name, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  async getActiveSessions(userId: string): Promise<{ id: string; deviceInfo: string; ipAddress: string; lastActivity: Date; createdAt: Date }[]> {
    const result = await query(
      `SELECT id, device_info, ip_address, last_activity, created_at 
       FROM sessions 
       WHERE user_id = $1 AND expires_at > NOW()
       ORDER BY last_activity DESC`,
      [userId]
    );

    return result.rows.map(row => ({
      id: row.id,
      deviceInfo: row.device_info || 'Unbekanntes Gerät',
      ipAddress: row.ip_address || 'Unbekannt',
      lastActivity: row.last_activity,
      createdAt: row.created_at,
    }));
  }

  async revokeSession(userId: string, sessionId: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  private async cleanupExpiredSessions(userId: string): Promise<void> {
    await query(
      'DELETE FROM sessions WHERE user_id = $1 AND expires_at < NOW()',
      [userId]
    );
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }
}

export const authService = new AuthService();
