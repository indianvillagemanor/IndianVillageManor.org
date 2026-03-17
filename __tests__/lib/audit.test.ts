// Mock prisma to avoid real database access in unit tests
const mockFindUnique = jest.fn();
jest.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: {
      create: jest.fn().mockResolvedValue({}),
    },
    user: {
      findUnique: mockFindUnique,
    },
  },
}));

// Mock the filesystem to avoid writing real log files
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  appendFileSync: jest.fn(),
}));

import { isBot, formatActor, logAuditEvent } from '@/lib/audit';
import { prisma } from '@/lib/prisma';

describe('audit utilities', () => {
  describe('isBot', () => {
    it('detects Googlebot', () => {
      expect(isBot('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')).toBe(true);
    });

    it('detects Bingbot', () => {
      expect(isBot('Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)')).toBe(true);
    });

    it('detects curl', () => {
      expect(isBot('curl/7.68.0')).toBe(true);
    });

    it('detects wget', () => {
      expect(isBot('Wget/1.21')).toBe(true);
    });

    it('detects Python requests', () => {
      expect(isBot('python-requests/2.28.0')).toBe(true);
    });

    it('does not flag Chrome browser', () => {
      expect(isBot('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36')).toBe(false);
    });

    it('does not flag Firefox', () => {
      expect(isBot('Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/121.0')).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isBot(undefined)).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isBot('')).toBe(false);
    });
  });

  describe('formatActor', () => {
    it('formats user with name and unit', () => {
      expect(formatActor({
        userName: 'John Doe',
        unitNumber: '101',
        action: 'test',
        success: true,
      })).toBe('John Doe (Unit: 101)');
    });

    it('uses userName when no unit', () => {
      expect(formatActor({
        userName: 'John Doe',
        action: 'test',
        success: true,
      })).toBe('John Doe');
    });

    it('falls back to email', () => {
      expect(formatActor({
        userEmail: 'john@example.com',
        action: 'test',
        success: true,
      })).toBe('john@example.com');
    });

    it('returns anonymous when no user info', () => {
      expect(formatActor({
        action: 'test',
        success: true,
      })).toBe('anonymous');
    });
  });

  describe('logAuditEvent', () => {
    const mockAuditLogCreate = prisma.auditLog.create as jest.Mock;

    beforeEach(() => {
      jest.clearAllMocks();
      mockFindUnique.mockResolvedValue(null);
    });

    it('enriches entry with user data when only userId is provided', async () => {
      mockFindUnique.mockResolvedValue({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        unitNumber: '202',
      });

      await logAuditEvent({
        userId: 'user-uuid-123',
        action: 'document_uploaded',
        entityType: 'Document',
        entityId: 'doc-uuid-456',
        success: true,
      });

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'user-uuid-123' },
        select: { firstName: true, lastName: true, email: true, unitNumber: true },
      });

      const createCall = mockAuditLogCreate.mock.calls[0][0];
      expect(createCall.data.details).toMatchObject({
        actor: 'Jane Smith (Unit: 202)',
      });
    });

    it('does not perform a user lookup when userName is already provided', async () => {
      await logAuditEvent({
        userId: 'user-uuid-123',
        userName: 'Existing Name',
        action: 'document_uploaded',
        success: true,
      });

      expect(mockFindUnique).not.toHaveBeenCalled();

      const createCall = mockAuditLogCreate.mock.calls[0][0];
      expect(createCall.data.details).toMatchObject({
        actor: 'Existing Name',
      });
    });

    it('does not perform a user lookup when userEmail is already provided', async () => {
      await logAuditEvent({
        userId: 'user-uuid-123',
        userEmail: 'existing@example.com',
        action: 'user_approved',
        success: true,
      });

      expect(mockFindUnique).not.toHaveBeenCalled();

      const createCall = mockAuditLogCreate.mock.calls[0][0];
      expect(createCall.data.details).toMatchObject({
        actor: 'existing@example.com',
      });
    });

    it('stores actor as anonymous when no userId and no user info', async () => {
      await logAuditEvent({
        action: 'PAGE_VIEW',
        success: true,
        userAgent: 'Mozilla/5.0 Chrome/120.0',
      });

      expect(mockFindUnique).not.toHaveBeenCalled();

      const createCall = mockAuditLogCreate.mock.calls[0][0];
      expect(createCall.data.details).toMatchObject({
        actor: 'anonymous',
      });
    });

    it('proceeds gracefully when user lookup fails', async () => {
      mockFindUnique.mockRejectedValue(new Error('DB connection failed'));

      await expect(logAuditEvent({
        userId: 'user-uuid-123',
        action: 'document_uploaded',
        success: true,
      })).resolves.not.toThrow();

      // Should still write the log entry (with anonymous actor as fallback)
      const createCall = mockAuditLogCreate.mock.calls[0][0];
      expect(createCall.data.details).toMatchObject({
        actor: 'anonymous',
      });
    });
  });
});
