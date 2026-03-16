import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

// GET /api/admin/committees - List all committees with member and document counts
export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { roles: true },
  });

  if (!user || !user.roles.some(r => r.name === 'dbadmin')) {
    return NextResponse.json({ error: 'Forbidden: dbadmin role required' }, { status: 403 });
  }

  const committees = await prisma.committee.findMany({
    include: {
      _count: {
        select: {
          members: true,
          documents: {
            where: { deleted: false },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  const result = committees.map(c => ({
    id: c.id,
    name: c.name,
    description: c.description,
    hasNewsletterFeature: c.hasNewsletterFeature,
    memberCount: c._count.members,
    documentCount: c._count.documents,
  }));

  return NextResponse.json({ committees: result });
}

// POST /api/admin/committees - Create a new committee
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { roles: true },
  });

  if (!user || !user.roles.some(r => r.name === 'dbadmin')) {
    return NextResponse.json({ error: 'Forbidden: dbadmin role required' }, { status: 403 });
  }

  const body = await request.json();
  const { name, description } = body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Committee name is required' }, { status: 400 });
  }

  const committee = await prisma.committee.create({
    data: {
      name: name.trim(),
      description: description ? description.trim() : null,
    },
  });

  await logAuditEvent({
    userId: session.user.id,
    action: 'committee_created',
    entityType: 'Committee',
    entityId: committee.id,
    success: true,
    details: {
      name: committee.name,
      description: committee.description,
    },
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  });

  return NextResponse.json({ committee }, { status: 201 });
}
