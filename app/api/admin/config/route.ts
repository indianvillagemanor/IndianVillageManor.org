import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

// Numeric config keys that require positive number validation
const NUMERIC_KEYS = [
  'session_timeout_days',
  'max_upload_size_mb',
  'disk_alert_threshold_percent',
  'rate_limit_magic_link_requests',
  'rate_limit_login_attempts',
];

// GET /api/admin/config - List all SystemConfig entries
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { roles: true },
  });

  if (!admin || !admin.roles.some(r => r.name === 'dbadmin')) {
    return NextResponse.json({ error: 'Forbidden: dbadmin role required' }, { status: 403 });
  }

  const configs = await prisma.systemConfig.findMany({
    orderBy: { key: 'asc' },
  });

  return NextResponse.json({
    configs: configs.map(c => ({
      id: c.id,
      key: c.key,
      value: c.value,
      description: c.description,
      isNumeric: NUMERIC_KEYS.includes(c.key),
      updatedBy: c.updatedBy,
      updatedAt: c.updatedAt.toISOString(),
    })),
  });
}

// PUT /api/admin/config - Update config values
// Body: { updates: Array<{ key: string, value: string }> }
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { roles: true },
  });

  if (!admin || !admin.roles.some(r => r.name === 'dbadmin')) {
    return NextResponse.json({ error: 'Forbidden: dbadmin role required' }, { status: 403 });
  }

  const body = await request.json();
  const { updates } = body;

  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json(
      { error: 'updates must be a non-empty array of { key, value } objects' },
      { status: 400 }
    );
  }

  // Validate all updates
  const validationErrors: string[] = [];
  for (const update of updates) {
    if (!update.key || typeof update.value !== 'string') {
      validationErrors.push(`Invalid update: key and value are required`);
      continue;
    }

    if (update.value.trim() === '') {
      validationErrors.push(`Config "${update.key}" cannot be empty`);
      continue;
    }

    if (NUMERIC_KEYS.includes(update.key)) {
      const num = Number(update.value);
      if (isNaN(num) || num <= 0 || !Number.isInteger(num)) {
        validationErrors.push(`Config "${update.key}" must be a positive whole number`);
      }
    }
  }

  if (validationErrors.length > 0) {
    return NextResponse.json({ error: validationErrors.join('; ') }, { status: 400 });
  }

  const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Fetch existing values for audit log
  const keys = updates.map((u: { key: string; value: string }) => u.key);
  const existingConfigs = await prisma.systemConfig.findMany({
    where: { key: { in: keys } },
  });
  const existingMap = new Map(existingConfigs.map(c => [c.key, c.value]));

  // Apply updates
  const updatePromises = updates.map((u: { key: string; value: string }) =>
    prisma.systemConfig.updateMany({
      where: { key: u.key },
      data: {
        value: u.value.trim(),
        updatedBy: session.user.id,
      },
    })
  );

  await Promise.all(updatePromises);

  // Build change diff for audit
  const changes: Record<string, { from: string | undefined; to: string }> = {};
  for (const update of updates) {
    const oldVal = existingMap.get(update.key);
    if (oldVal !== update.value.trim()) {
      changes[update.key] = { from: oldVal, to: update.value.trim() };
    }
  }

  if (Object.keys(changes).length > 0) {
    await logAuditEvent({
      userId: session.user.id,
      action: 'config_updated',
      entityType: 'SystemConfig',
      success: true,
      details: { adminEmail: admin.email, changes },
      ipAddress,
      userAgent,
    });
  }

  return NextResponse.json({ success: true, message: 'Configuration updated successfully' });
}
