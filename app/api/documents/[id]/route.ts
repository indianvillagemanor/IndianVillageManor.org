import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { generatePdfThumbnail, deletePdfThumbnail } from '@/lib/pdf-thumbnail';
import { generatePublicSlug } from '@/lib/public-slug';
import path from 'path';
import fs from 'fs/promises';

const DOCUMENTS_BASE = '/data/documents';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Ensure directory exists (using try/catch instead of existsSync)
async function ensureDir(dir: string): Promise<void> {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

// Shared helper: get user with roles/committees from session
async function getAuthorizedUser(sessionUserId: string) {
  return prisma.user.findUnique({
    where: { id: sessionUserId },
    include: {
      roles: true,
      committees: { select: { id: true } },
    },
  });
}

// PATCH /api/documents/[id] - Publish, archive, or toggle newsletter on a document
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: documentId } = await params;

  const user = await getAuthorizedUser(session.user.id);
  if (!user || user.verificationStatus !== 'verified') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  const isAdmin = user.roles.some(r => r.name === 'dbadmin');
  const isPublisher = user.roles.some(r => r.name === 'publisher');
  const isMember = user.committees.some(c => c.id === document.committeeId);

  if (!isAdmin && !(isPublisher && isMember)) {
    return NextResponse.json(
      { error: 'Forbidden: publisher role and committee membership required' },
      { status: 403 }
    );
  }

  if (document.deleted) {
    return NextResponse.json(
      { error: 'Cannot change state of a deleted document' },
      { status: 400 }
    );
  }

  let body: { action?: string; title?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { action, title: newTitle } = body;

  if (
    action !== 'publish' &&
    action !== 'archive' &&
    action !== 'set_newsletter' &&
    action !== 'unset_newsletter' &&
    action !== 'set_public' &&
    action !== 'unset_public' &&
    action !== 'rename'
  ) {
    return NextResponse.json(
      { error: 'action must be "publish", "archive", "set_newsletter", "unset_newsletter", "set_public", "unset_public", or "rename"' },
      { status: 400 }
    );
  }

  // Handle rename
  if (action === 'rename') {
    if (typeof newTitle !== 'string') {
      return NextResponse.json({ error: 'Title must be a string' }, { status: 400 });
    }
    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (trimmedTitle.length > 200) {
      return NextResponse.json({ error: 'Title must be 200 characters or fewer' }, { status: 400 });
    }

    const updated = await prisma.document.update({
      where: { id: documentId },
      data: { title: trimmedTitle },
    });

    await logAuditEvent({
      userId: session.user.id,
      action: 'document_renamed',
      entityType: 'Document',
      entityId: documentId,
      success: true,
      details: {
        committeeId: document.committeeId,
        oldTitle: document.title,
        newTitle: trimmedTitle,
      },
      ipAddress:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({ document: updated });
  }

  // Handle newsletter toggling
  if (action === 'set_newsletter' || action === 'unset_newsletter') {
    // Fetch committee to verify it supports newsletters
    const committee = await prisma.committee.findUnique({
      where: { id: document.committeeId },
    });

    if (action === 'set_newsletter') {
      if (!committee?.hasNewsletterFeature) {
        return NextResponse.json(
          { error: 'This committee does not support newsletter documents' },
          { status: 400 }
        );
      }

      // Only PDFs can be newsletters
      const ext = path.extname(document.filename).toLowerCase();
      if (ext !== '.pdf') {
        return NextResponse.json(
          { error: 'Only PDF files can be marked as newsletters' },
          { status: 400 }
        );
      }

      // Generate thumbnail if not already present
      let thumbnailPath = document.thumbnailPath;
      if (!thumbnailPath) {
        const filePath = path.join(DOCUMENTS_BASE, document.filename);
        thumbnailPath = await generatePdfThumbnail(filePath, documentId);
      }

      const updated = await prisma.document.update({
        where: { id: documentId },
        data: { isNewsletter: true, thumbnailPath },
      });

      await logAuditEvent({
        userId: session.user.id,
        action: 'document_newsletter_set',
        entityType: 'Document',
        entityId: documentId,
        success: true,
        details: {
          committeeId: document.committeeId,
          title: document.title,
          thumbnailGenerated: thumbnailPath !== null,
        },
        ipAddress:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });

      return NextResponse.json({ document: updated });
    } else {
      // unset_newsletter: remove newsletter flag and delete thumbnail
      if (document.thumbnailPath) {
        await deletePdfThumbnail(document.thumbnailPath);
      }

      const updated = await prisma.document.update({
        where: { id: documentId },
        data: { isNewsletter: false, thumbnailPath: null },
      });

      await logAuditEvent({
        userId: session.user.id,
        action: 'document_newsletter_unset',
        entityType: 'Document',
        entityId: documentId,
        success: true,
        details: { committeeId: document.committeeId, title: document.title },
        ipAddress:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });

      return NextResponse.json({ document: updated });
    }
  }

  // Handle public toggle
  if (action === 'set_public' || action === 'unset_public') {
    if (action === 'set_public') {
      // Reuse existing slug if one was already generated (stable URL)
      let slug = document.publicSlug;
      if (!slug) {
        // Generate and ensure uniqueness (retry once on collision)
        for (let attempt = 0; attempt < 3; attempt++) {
          const candidate = generatePublicSlug(document.title, document.filename);
          const existing = await prisma.document.findUnique({ where: { publicSlug: candidate } });
          if (!existing) {
            slug = candidate;
            break;
          }
        }
        if (!slug) {
          return NextResponse.json({ error: 'Could not generate a unique slug; please try again' }, { status: 500 });
        }
      }

      const updated = await prisma.document.update({
        where: { id: documentId },
        data: { isPublic: true, publicSlug: slug },
      });

      await logAuditEvent({
        userId: session.user.id,
        action: 'document_set_public',
        entityType: 'Document',
        entityId: documentId,
        success: true,
        details: { committeeId: document.committeeId, title: document.title, publicSlug: slug },
        ipAddress:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });

      return NextResponse.json({ document: updated });
    } else {
      // unset_public: clear the flag but keep the slug so the URL stays stable if re-enabled
      const updated = await prisma.document.update({
        where: { id: documentId },
        data: { isPublic: false },
      });

      await logAuditEvent({
        userId: session.user.id,
        action: 'document_unset_public',
        entityType: 'Document',
        entityId: documentId,
        success: true,
        details: { committeeId: document.committeeId, title: document.title },
        ipAddress:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });

      return NextResponse.json({ document: updated });
    }
  }

  // Handle publish/archive
  let updateData: Record<string, boolean>;
  let auditAction: string;

  if (action === 'publish') {
    updateData = { published: true, archived: false };
    auditAction = 'document_published';
  } else {
    // archive
    updateData = { archived: true, published: false };
    auditAction = 'document_archived';
  }

  const updated = await prisma.document.update({
    where: { id: documentId },
    data: updateData,
  });

  await logAuditEvent({
    userId: session.user.id,
    action: auditAction,
    entityType: 'Document',
    entityId: documentId,
    success: true,
    details: { committeeId: document.committeeId, title: document.title, action },
    ipAddress:
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  });

  return NextResponse.json({ document: updated });
}

// DELETE /api/documents/[id] - Soft delete (move to trash)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: documentId } = await params;

  const user = await getAuthorizedUser(session.user.id);
  if (!user || user.verificationStatus !== 'verified') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  const isAdmin = user.roles.some(r => r.name === 'dbadmin');
  const isPublisher = user.roles.some(r => r.name === 'publisher');
  const isMember = user.committees.some(c => c.id === document.committeeId);

  if (!isAdmin && !(isPublisher && isMember)) {
    return NextResponse.json(
      { error: 'Forbidden: publisher role and committee membership required' },
      { status: 403 }
    );
  }

  if (document.deleted) {
    return NextResponse.json({ error: 'Document is already deleted' }, { status: 400 });
  }

  // Move file from documents dir to .trash
  const srcPath = path.join(DOCUMENTS_BASE, document.filename);
  const trashDir = path.join(DOCUMENTS_BASE, document.committeeId, '.trash');
  const basename = path.basename(document.filename);
  const destPath = path.join(trashDir, basename);

  await ensureDir(trashDir);

  // Only move file if it actually exists
  try {
    await fs.access(srcPath);
    await fs.rename(srcPath, destPath);
  } catch {
    // File may not exist (e.g., dev environment without /data); continue to update DB
    console.warn(`Could not move document file ${srcPath} to trash: file may not exist`);
  }

  const updated = await prisma.document.update({
    where: { id: documentId },
    data: {
      deleted: true,
      deletedAt: new Date(),
      deletedBy: session.user.id,
      published: false,
      archived: false,
    },
  });

  await logAuditEvent({
    userId: session.user.id,
    action: 'document_deleted',
    entityType: 'Document',
    entityId: documentId,
    success: true,
    details: { committeeId: document.committeeId, title: document.title },
    ipAddress:
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  });

  return NextResponse.json({ document: updated });
}
