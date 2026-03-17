import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

export interface AuditLogEntry {
  userId?: string;
  userEmail?: string;
  userName?: string;
  unitNumber?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
}

const LOG_DIR = process.env.AUDIT_LOG_DIR || (process.env.NODE_ENV === 'production' ? '/data/logs' : './data/logs');

// Common bot/robot user-agent patterns
const BOT_PATTERNS = [
  /bot/i, /crawl/i, /spider/i, /slurp/i, /mediapartners/i,
  /googlebot/i, /bingbot/i, /yandex/i, /baiduspider/i,
  /facebookexternalhit/i, /twitterbot/i, /rogerbot/i,
  /linkedinbot/i, /embedly/i, /quora link preview/i,
  /showyoubot/i, /outbrain/i, /pinterest/i, /applebot/i,
  /developers\.google\.com/i, /google-structured-data-testing-tool/i,
  /semrush/i, /ahrefsbot/i, /mj12bot/i, /dotbot/i,
  /petalbot/i, /uptimerobot/i, /headlesschrome/i,
  /phantomjs/i, /python-requests/i, /curl\//i, /wget\//i,
  /scrapy/i, /httpclient/i, /java\//i, /libwww/i,
  /go-http-client/i, /node-fetch/i, /axios/i,
];

/**
 * Check if a user-agent string belongs to a known bot/robot
 */
export function isBot(userAgent?: string): boolean {
  if (!userAgent) return false;
  return BOT_PATTERNS.some(pattern => pattern.test(userAgent));
}

/**
 * Format actor string: "firstName lastName (Unit: X)" or "anonymous"
 */
export function formatActor(entry: AuditLogEntry): string {
  if (entry.userName && entry.unitNumber) {
    return `${entry.userName} (Unit: ${entry.unitNumber})`;
  }
  if (entry.userName) {
    return entry.userName;
  }
  if (entry.userEmail) {
    return entry.userEmail;
  }
  return 'anonymous';
}

// Ensure log directory exists
function ensureLogDirectory() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

// JSON-lines log format for audit.log
function formatLogEntry(entry: AuditLogEntry): string {
  const logObj = {
    timestamp: new Date().toISOString(),
    userId: entry.userId || null,
    actor: formatActor(entry),
    action: entry.action,
    entityType: entry.entityType || null,
    entityId: entry.entityId || null,
    success: entry.success,
    ipAddress: entry.ipAddress || null,
    userAgent: entry.userAgent || null,
    isBot: isBot(entry.userAgent),
    details: entry.details || null,
  };
  return JSON.stringify(logObj) + '\n';
}

// Write to consolidated audit.log file
async function writeToLogFile(entry: AuditLogEntry): Promise<void> {
  try {
    ensureLogDirectory();
    const logFile = path.join(LOG_DIR, 'audit.log');
    const logLine = formatLogEntry(entry);
    fs.appendFileSync(logFile, logLine);
  } catch (error) {
    console.error('Error writing to audit log file:', error);
  }
}

// Write to database AuditLog table
async function writeToDatabase(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId || null,
        action: entry.action,
        entityType: entry.entityType || null,
        entityId: entry.entityId || null,
        details: ({
          ...entry.details,
          actor: formatActor(entry),
          isBot: isBot(entry.userAgent),
        }) as Prisma.JsonObject,
        ipAddress: entry.ipAddress || null,
        userAgent: entry.userAgent || null,
      },
    });
  } catch (error) {
    console.error('Error writing to audit log database:', error);
  }
}

// Main audit logging function
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  // Skip bot traffic for anonymous page views
  if (!entry.userId && entry.action === 'PAGE_VIEW' && isBot(entry.userAgent)) {
    return;
  }

  // If userId is provided but userName/userEmail are missing, look up the user
  // so that formatActor() can produce a meaningful actor name instead of "anonymous".
  let enrichedEntry = entry;
  if (entry.userId && !entry.userName && !entry.userEmail) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: entry.userId },
        select: { firstName: true, lastName: true, email: true, unitNumber: true },
      });
      if (user) {
        enrichedEntry = {
          ...entry,
          userName: `${user.firstName} ${user.lastName}`,
          userEmail: user.email,
          unitNumber: entry.unitNumber || user.unitNumber,
        };
      }
    } catch (err) {
      // If lookup fails, log the error and proceed with the original entry
      console.error('Failed to look up user for audit log enrichment:', err);
    }
  }

  await Promise.all([
    writeToLogFile(enrichedEntry),
    writeToDatabase(enrichedEntry),
  ]);
}

// Convenience functions for common auth events
export async function logLoginAttempt(
  email: string,
  success: boolean,
  ipAddress?: string,
  userAgent?: string,
  userId?: string,
  reason?: string
): Promise<void> {
  await logAuditEvent({
    userId,
    userEmail: email,
    userName: email,
    action: 'LOGIN_ATTEMPT',
    entityType: 'User',
    success,
    ipAddress,
    userAgent,
    details: reason ? { reason } : undefined,
  });
}

export async function logMagicLinkRequest(
  email: string,
  success: boolean,
  ipAddress?: string,
  userAgent?: string,
  reason?: string
): Promise<void> {
  await logAuditEvent({
    userEmail: email,
    userName: email,
    action: 'MAGIC_LINK_REQUEST',
    entityType: 'User',
    success,
    ipAddress,
    userAgent,
    details: reason ? { reason } : undefined,
  });
}

export async function logLogout(
  userId: string,
  userEmail: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    userId,
    userEmail,
    userName: userEmail,
    action: 'LOGOUT',
    entityType: 'User',
    success: true,
    ipAddress,
    userAgent,
  });
}

export async function logSessionCreated(
  userId: string,
  userEmail: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    userId,
    userEmail,
    userName: userEmail,
    action: 'SESSION_CREATED',
    entityType: 'User',
    success: true,
    ipAddress,
    userAgent,
  });
}

/**
 * Clean up old audit log entries based on retention policies from SystemConfig.
 * Returns the number of deleted entries.
 */
export async function cleanupAuditLogs(): Promise<{ authenticatedDeleted: number; anonymousDeleted: number }> {
  const [authRetention, anonRetention] = await Promise.all([
    prisma.systemConfig.findUnique({ where: { key: 'audit_log_retention_days' } }),
    prisma.systemConfig.findUnique({ where: { key: 'anonymous_log_retention_days' } }),
  ]);

  const authDays = parseInt(authRetention?.value || '365');
  const anonDays = parseInt(anonRetention?.value || '90');

  const authCutoff = new Date(Date.now() - authDays * 24 * 60 * 60 * 1000);
  const anonCutoff = new Date(Date.now() - anonDays * 24 * 60 * 60 * 1000);

  // Delete old authenticated logs
  const authResult = await prisma.auditLog.deleteMany({
    where: {
      userId: { not: null },
      createdAt: { lt: authCutoff },
    },
  });

  // Delete old anonymous logs
  const anonResult = await prisma.auditLog.deleteMany({
    where: {
      userId: null,
      createdAt: { lt: anonCutoff },
    },
  });

  return {
    authenticatedDeleted: authResult.count,
    anonymousDeleted: anonResult.count,
  };
}

/**
 * Query audit logs with filtering support.
 */
export async function queryAuditLogs(filters: {
  userId?: string;
  action?: string;
  entityType?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
}): Promise<{ logs: Array<Record<string, unknown>>; total: number }> {
  const where: Prisma.AuditLogWhereInput = {};

  if (filters.userId) where.userId = filters.userId;
  if (filters.action) where.action = filters.action;
  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
    if (filters.dateTo) where.createdAt.lte = filters.dateTo;
  }

  const page = filters.page || 1;
  const pageSize = filters.pageSize || 50;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs: logs as unknown as Array<Record<string, unknown>>, total };
}

// Rate limiting tracking (in-memory)
interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean old entries every hour
setInterval(() => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.lastAttempt > oneHour) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 60 * 1000);

export async function checkRateLimit(
  identifier: string,
  limitType: 'login' | 'magic-link',
  maxAttempts: number,
  windowMinutes: number = 60
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const key = `${limitType}:${identifier}`;
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;

  let entry = rateLimitStore.get(key);

  if (!entry || now - entry.firstAttempt > windowMs) {
    entry = {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
    };
    rateLimitStore.set(key, entry);

    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetAt: new Date(now + windowMs),
    };
  }

  entry.count += 1;
  entry.lastAttempt = now;
  rateLimitStore.set(key, entry);

  const allowed = entry.count <= maxAttempts;
  const remaining = Math.max(0, maxAttempts - entry.count);
  const resetAt = new Date(entry.firstAttempt + windowMs);

  return { allowed, remaining, resetAt };
}

// Track failed login attempts per user
const failedLoginAttempts = new Map<string, number>();

export function incrementFailedLoginAttempts(email: string): number {
  const current = failedLoginAttempts.get(email) || 0;
  const newCount = current + 1;
  failedLoginAttempts.set(email, newCount);
  return newCount;
}

export function resetFailedLoginAttempts(email: string): void {
  failedLoginAttempts.delete(email);
}

export function getFailedLoginAttempts(email: string): number {
  return failedLoginAttempts.get(email) || 0;
}
