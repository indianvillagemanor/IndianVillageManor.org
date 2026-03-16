import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/committees/[id] - Get a single committee with full details
export async function GET(_request: NextRequest, { params }: RouteParams) {
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

  const { id } = await params;

  const committee = await prisma.committee.findUnique({
    where: { id },
    include: {
      members: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          unitNumber: true,
          verificationStatus: true,
        },
      },
      documents: {
        where: { deleted: false },
        select: {
          id: true,
          title: true,
          published: true,
          archived: true,
          uploadedAt: true,
        },
        orderBy: { uploadedAt: 'desc' },
      },
    },
  });

  if (!committee) {
    return NextResponse.json({ error: 'Committee not found' }, { status: 404 });
  }

  return NextResponse.json({ committee });
}

// PUT /api/admin/committees/[id] - Update a committee
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

  const { id } = await params;

  const existing = await prisma.committee.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Committee not found' }, { status: 404 });
  }

  const body = await request.json();
  const { name, description, hasNewsletterFeature } = body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Committee name is required' }, { status: 400 });
  }

  const committee = await prisma.committee.update({
    where: { id },
    data: {
      name: name.trim(),
      description: description !== undefined ? (description ? description.trim() : null) : existing.description,
      hasNewsletterFeature: typeof hasNewsletterFeature === 'boolean' ? hasNewsletterFeature : existing.hasNewsletterFeature,
    },
  });

  await logAuditEvent({
    userId: session.user.id,
    action: 'committee_updated',
    entityType: 'Committee',
    entityId: id,
    success: true,
    details: {
      previousName: existing.name,
      newName: committee.name,
      previousDescription: existing.description,
      newDescription: committee.description,
    },
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  });

  return NextResponse.json({ committee });
}

// DELETE /api/admin/committees/[id] - Delete a committee (only if no documents)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

  const { id } = await params;

  const committee = await prisma.committee.findUnique({
    where: { id },
    include: {
      _count: {
        select: { documents: true },
      },
    },
  });

  if (!committee) {
    return NextResponse.json({ error: 'Committee not found' }, { status: 404 });
  }

  if (committee._count.documents > 0) {
    return NextResponse.json(
      { error: 'Cannot delete committee with existing documents' },
      { status: 400 }
    );
  }

  await prisma.committee.delete({ where: { id } });

  await logAuditEvent({
    userId: session.user.id,
    action: 'committee_deleted',
    entityType: 'Committee',
    entityId: id,
    success: true,
    details: {
      name: committee.name,
      description: committee.description,
    },
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  });

  return NextResponse.json({ success: true, message: 'Committee deleted successfully' });
}
