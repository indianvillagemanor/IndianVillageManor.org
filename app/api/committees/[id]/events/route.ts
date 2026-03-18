import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/committees/[id]/events - List events for a committee
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { verificationStatus: true },
  });

  if (!user || user.verificationStatus !== 'verified') {
    return NextResponse.json({ error: 'Forbidden: verified status required' }, { status: 403 });
  }

  const { id: committeeId } = await params;

  const committee = await prisma.committee.findUnique({
    where: { id: committeeId },
    select: { id: true },
  });

  if (!committee) {
    return NextResponse.json({ error: 'Committee not found' }, { status: 404 });
  }

  const events = await prisma.event.findMany({
    where: { committeeId },
    orderBy: { startAt: 'asc' },
  });

  return NextResponse.json({
    events: events.map(e => ({
      id: e.id,
      title: e.title,
      description: e.description,
      startAt: e.startAt.toISOString(),
      endAt: e.endAt?.toISOString() || null,
      createdAt: e.createdAt.toISOString(),
    })),
  });
}

// POST /api/committees/[id]/events - Create an event for a committee
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: committeeId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      roles: { select: { name: true } },
      committees: { select: { id: true } },
    },
  });

  if (!user || user.verificationStatus !== 'verified') {
    return NextResponse.json({ error: 'Forbidden: verified status required' }, { status: 403 });
  }

  const isAdmin = user.roles.some(r => r.name === 'dbadmin');
  const hasCalendarRole = user.roles.some(r => r.name === 'calendar');
  const isMember = user.committees.some(c => c.id === committeeId);

  if (!isAdmin && !(hasCalendarRole && isMember)) {
    return NextResponse.json(
      { error: 'Forbidden: calendar role and committee membership required' },
      { status: 403 }
    );
  }

  const committee = await prisma.committee.findUnique({
    where: { id: committeeId },
    select: { id: true },
  });

  if (!committee) {
    return NextResponse.json({ error: 'Committee not found' }, { status: 404 });
  }

  let body: { title?: string; description?: string; startAt?: string; endAt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { title, description, startAt, endAt } = body;

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
      return NextResponse.json(
        { error: 'End date/time must be after start date/time' },
        { status: 400 }
      );
    }
  }

  const event = await prisma.event.create({
    data: {
      committeeId,
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
    details: { title: event.title, startAt: event.startAt.toISOString(), committeeId },
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
