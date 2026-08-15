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
      _count: {
        select: { events: true },
      },
    },
  });

  if (!committee) {
    return NextResponse.json({ error: 'Committee not found' }, { status: 404 });
  }

  return NextResponse.json({ committee });
}

// PUT /api/admin/committees/[id] - Update a committee (name, description, newsletter, archived)
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
  const { name, description, hasNewsletterFeature, archived } = body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Committee name is required' }, { status: 400 });
  }

  const committee = await prisma.committee.update({
    where: { id },
    data: {
      name: name.trim(),
      description: description !== undefined ? (description ? description.trim() : null) : existing.description,
      hasNewsletterFeature: typeof hasNewsletterFeature === 'boolean' ? hasNewsletterFeature : existing.hasNewsletterFeature,
      archived: typeof archived === 'boolean' ? archived : existing.archived,
    },
  });

  const archivedChanged = typeof archived === 'boolean' && archived !== existing.archived;
  const action = archivedChanged
    ? (archived ? 'committee_archived' : 'committee_unarchived')
    : 'committee_updated';

  await logAuditEvent({
    userId: session.user.id,
    action,
    entityType: 'Committee',
    entityId: id,
    success: true,
    details: {
      previousName: existing.name,
      newName: committee.name,
      previousDescription: existing.description,
      newDescription: committee.description,
      archived: committee.archived,
    },
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  });

  return NextResponse.json({ committee });
}

// DELETE /api/admin/committees/[id] - Delete a committee
// If the committee has documents or events, a transferToCommitteeId must be provided
// in the request body to transfer assets before deletion. Returns 409 with asset
// counts when blocking assets exist and no transfer target is supplied.
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
        select: {
          documents: { where: { deleted: false } },
          events: true,
        },
      },
    },
  });

  if (!committee) {
    return NextResponse.json({ error: 'Committee not found' }, { status: 404 });
  }

  const documentCount = committee._count.documents;
  const eventCount = committee._count.events;
  const hasAssets = documentCount > 0 || eventCount > 0;

  // Parse optional transfer target from request body
  let transferToCommitteeId: string | null = null;
  try {
    const body = await request.json();
    if (body?.transferToCommitteeId && typeof body.transferToCommitteeId === 'string') {
      transferToCommitteeId = body.transferToCommitteeId;
    }
  } catch (err) {
    // Body may be empty – that is acceptable. Log unexpected parse failures.
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes('Unexpected end')) {
      console.warn('[DELETE committee] Failed to parse request body:', message);
    }
  }

  if (hasAssets && !transferToCommitteeId) {
    // Inform the caller about blocking assets so the UI can present transfer options
    return NextResponse.json(
      {
        error: 'Committee has documents or events that must be transferred or deleted first',
        documentCount,
        eventCount,
      },
      { status: 409 }
    );
  }

  if (hasAssets && transferToCommitteeId) {
    // Validate the target committee exists and is not the same
    if (transferToCommitteeId === id) {
      return NextResponse.json(
        { error: 'Cannot transfer assets to the same committee' },
        { status: 400 }
      );
    }

    const targetCommittee = await prisma.committee.findUnique({ where: { id: transferToCommitteeId } });
    if (!targetCommittee) {
      return NextResponse.json({ error: 'Transfer target committee not found' }, { status: 404 });
    }

    // Transfer all non-deleted documents
    await prisma.document.updateMany({
      where: { committeeId: id, deleted: false },
      data: { committeeId: transferToCommitteeId },
    });

    // Transfer all events
    await prisma.event.updateMany({
      where: { committeeId: id },
      data: { committeeId: transferToCommitteeId },
    });

    await logAuditEvent({
      userId: session.user.id,
      action: 'committee_assets_transferred',
      entityType: 'Committee',
      entityId: id,
      success: true,
      details: {
        fromCommitteeName: committee.name,
        toCommitteeId: transferToCommitteeId,
        toCommitteeName: targetCommittee.name,
        documentCount,
        eventCount,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });
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
      transferredToCommitteeId: transferToCommitteeId ?? undefined,
    },
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  });

  return NextResponse.json({ success: true, message: 'Committee deleted successfully' });
}

