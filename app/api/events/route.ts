import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: List all events (read-only calendar view)
// - Verified users see all events (past and current)
// - Anonymous/non-verified users see only events from current month onward
export async function GET() {
  const session = await getServerSession(authOptions);

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const isVerified = session?.user?.verificationStatus === 'verified';

  let events;
  if (isVerified) {
    events = await prisma.event.findMany({
      include: { committee: { select: { id: true, name: true } } },
      orderBy: { startAt: 'asc' },
    });
  } else {
    events = await prisma.event.findMany({
      where: { startAt: { gte: currentMonthStart } },
      include: { committee: { select: { id: true, name: true } } },
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
      committeeId: e.committee.id,
      committeeName: e.committee.name,
    })),
    isVerified,
    currentMonthStart: currentMonthStart.toISOString(),
  });
}
