// Mock prisma before any imports that reference it
const mockFindUnique = jest.fn();
const mockDelete = jest.fn();
const mockUpdate = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: {
    verificationToken: {
      findUnique: mockFindUnique,
      delete: mockDelete,
      update: mockUpdate,
    },
  },
}));

import { useReusableVerificationToken, MAGIC_LINK_REUSE_WINDOW_MS } from '@/lib/magic-link';

describe('useReusableVerificationToken', () => {
  const params = { identifier: 'user@example.com', token: 'hashed-token-abc' };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns null when the token does not exist', async () => {
    mockFindUnique.mockResolvedValue(null);

    const result = await useReusableVerificationToken(params);

    expect(result).toBeNull();
    expect(mockDelete).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('extends the token expiry and returns the updated record when token is valid', async () => {
    const futureExpiry = new Date('2026-01-01T12:15:00Z'); // 15 min from "now"
    const record = { identifier: 'user@example.com', token: 'hashed-token-abc', expires: futureExpiry };
    const expectedReusableUntil = new Date(Date.now() + MAGIC_LINK_REUSE_WINDOW_MS);
    const updatedRecord = { ...record, expires: expectedReusableUntil };

    mockFindUnique.mockResolvedValue(record);
    mockUpdate.mockResolvedValue(updatedRecord);

    const result = await useReusableVerificationToken(params);

    expect(mockFindUnique).toHaveBeenCalledWith({ where: { token: params.token } });
    expect(mockDelete).not.toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { token: params.token },
      data: { expires: expectedReusableUntil },
    });
    expect(result).toEqual(updatedRecord);
  });

  it('allows the link to be used again after a preview request (same window)', async () => {
    // Simulate a first click that already set the expiry to 30 min from now
    const alreadyExtendedExpiry = new Date(Date.now() + MAGIC_LINK_REUSE_WINDOW_MS);
    const record = { identifier: 'user@example.com', token: 'hashed-token-abc', expires: alreadyExtendedExpiry };
    const updatedRecord = { ...record, expires: new Date(Date.now() + MAGIC_LINK_REUSE_WINDOW_MS) };

    mockFindUnique.mockResolvedValue(record);
    mockUpdate.mockResolvedValue(updatedRecord);

    const result = await useReusableVerificationToken(params);

    // Should still extend and return the record (not return null)
    expect(mockUpdate).toHaveBeenCalled();
    expect(result).not.toBeNull();
  });

  it('cleans up and returns the stale record when the token is expired', async () => {
    const pastExpiry = new Date('2026-01-01T11:00:00Z'); // 1 hour before "now"
    const record = { identifier: 'user@example.com', token: 'hashed-token-abc', expires: pastExpiry };

    mockFindUnique.mockResolvedValue(record);
    mockDelete.mockResolvedValue(record);

    const result = await useReusableVerificationToken(params);

    expect(mockDelete).toHaveBeenCalledWith({ where: { token: params.token } });
    expect(mockUpdate).not.toHaveBeenCalled();
    // Returns the stale record so NextAuth can generate the "token expired" error
    expect(result).toEqual(record);
  });

  it('still returns the expired record when cleanup delete fails (e.g. already deleted)', async () => {
    const pastExpiry = new Date('2026-01-01T11:00:00Z');
    const record = { identifier: 'user@example.com', token: 'hashed-token-abc', expires: pastExpiry };

    mockFindUnique.mockResolvedValue(record);
    mockDelete.mockRejectedValue(new Error('Record not found'));

    const result = await useReusableVerificationToken(params);

    // Should not throw — delete failure is silently ignored
    expect(result).toEqual(record);
  });

  it('MAGIC_LINK_REUSE_WINDOW_MS is exactly 30 minutes', () => {
    expect(MAGIC_LINK_REUSE_WINDOW_MS).toBe(30 * 60 * 1000);
  });
});
