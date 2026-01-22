import bcrypt from 'bcryptjs';

// Mock the database
jest.mock('../src/config/database', () => ({
  query: jest.fn(),
}));

import { query } from '../src/config/database';
import { AuthService } from '../src/services/auth.service';

const mockedQuery = query as jest.MockedFunction<typeof query>;

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return user and token for valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('testpassword', 10);
      const mockUser = {
        id: 'test-uuid',
        email: 'test@example.com',
        password_hash: hashedPassword,
        name: 'Test User',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockedQuery.mockResolvedValueOnce({
        rows: [mockUser],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await authService.login('test@example.com', 'testpassword');

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user).not.toHaveProperty('password_hash');
    });

    it('should throw error for non-existent user', async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      await expect(authService.login('nonexistent@example.com', 'password'))
        .rejects.toThrow('Ungültige E-Mail oder Passwort.');
    });

    it('should throw error for invalid password', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      const mockUser = {
        id: 'test-uuid',
        email: 'test@example.com',
        password_hash: hashedPassword,
        name: 'Test User',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockedQuery.mockResolvedValueOnce({
        rows: [mockUser],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      await expect(authService.login('test@example.com', 'wrongpassword'))
        .rejects.toThrow('Ungültige E-Mail oder Passwort.');
    });
  });

  describe('getUserById', () => {
    it('should return user without password hash', async () => {
      const mockUser = {
        id: 'test-uuid',
        email: 'test@example.com',
        name: 'Test User',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockedQuery.mockResolvedValueOnce({
        rows: [mockUser],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await authService.getUserById('test-uuid');

      expect(result).toEqual(mockUser);
      expect(result).not.toHaveProperty('password_hash');
    });

    it('should return null for non-existent user', async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      const result = await authService.getUserById('non-existent-uuid');

      expect(result).toBeNull();
    });
  });

  describe('hashPassword', () => {
    it('should hash password correctly', async () => {
      const password = 'testpassword';
      const hash = await authService.hashPassword(password);

      expect(hash).not.toBe(password);
      expect(await bcrypt.compare(password, hash)).toBe(true);
    });
  });
});
