import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

// GET: List events with past event filtering based on verification status
export async function GET() {
  const session = await getServerSession(authOptions);

  // Calculate the start of the current calendar month
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Determine if user is verified
  const isVerified = session?.user?.verificationStatus === 'verified';

  let events;
  if (isVerified) {
    // Verified users see all events (past and current)
    events = await prisma.event.findMany({
      orderBy: { startAt: 'asc' },
    });
  } else {
    // Anonymous/non-verified users see only events from current month onward
    events = await prisma.event.findMany({
      where: {
        startAt: { gte: currentMonthStart },
      },
      orderBy: { startAt: 'asc' },
    });
  }

  return NextResponse.json({
    events: events.map(e => ({
      id: e.id,
      title: e.title,
      description: e.description,
      startAt: e.startAt.toISOString(),
      endAt: e.endAt?.toISOString() || null,
      createdAt: e.createdAt.toISOString(),
    })),
    isVerified,
    currentMonthStart: currentMonthStart.toISOString(),
  });
}

// POST: Create a new event (calendar role or dbadmin required)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = session.user.roles || [];
  const canManageEvents = roles.includes('calendar') || roles.includes('dbadmin');

  if (!canManageEvents) {
    return NextResponse.json({ error: 'Forbidden: calendar role required' }, { status: 403 });
  }

  let body: { title?: string; description?: string; startAt?: string; endAt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { title, description, startAt, endAt } = body;

  // Validate required fields
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  if (!startAt || isNaN(Date.parse(startAt))) {
    return NextResponse.json({ error: 'Valid start date/time is required' }, { status: 400 });
  }

  const startDate = new Date(startAt);
  let endDate: Date | null = null;

  if (endAt) {
    if (isNaN(Date.parse(endAt))) {
      return NextResponse.json({ error: 'Invalid end date/time' }, { status: 400 });
    }
    endDate = new Date(endAt);
    if (endDate <= startDate) {
      return NextResponse.json({ error: 'End date/time must be after start date/time' }, { status: 400 });
    }
  }

  const event = await prisma.event.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      startAt: startDate,
      endAt: endDate,
      createdBy: session.user.id,
    },
  });

  await logAuditEvent({
    userId: session.user.id,
    action: 'event_created',
    entityType: 'Event',
    entityId: event.id,
    details: { title: event.title, startAt: event.startAt.toISOString() },
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    userAgent: request.headers.get('user-agent') || undefined,
    success: true,
  });

  return NextResponse.json({
    event: {
      id: event.id,
      title: event.title,
      description: event.description,
      startAt: event.startAt.toISOString(),
      endAt: event.endAt?.toISOString() || null,
      createdAt: event.createdAt.toISOString(),
    },
  }, { status: 201 });
}
