import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { generatePdfThumbnail } from '@/lib/pdf-thumbnail';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

const DOCUMENTS_BASE = '/data/documents';
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
const DEFAULT_MAX_SIZE_MB = 25;

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Sanitize filename: replace spaces with underscores, strip special chars
function sanitizeFilename(name: string): string {
  return name
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_.\-]/g, '')
    .replace(/_{2,}/g, '_');
}

// Ensure directory exists (using try/catch instead of existsSync)
async function ensureDir(dir: string): Promise<void> {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

// POST /api/committees/[id]/documents - Upload a document
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: committeeId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      roles: true,
      committees: { select: { id: true } },
    },
  });

  if (!user || user.verificationStatus !== 'verified') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const isAdmin = user.roles.some(r => r.name === 'dbadmin');
  const isPublisher = user.roles.some(r => r.name === 'publisher');
  const isMember = user.committees.some(c => c.id === committeeId);

  // Only publisher + committee member, or dbadmin
  if (!isAdmin && !(isPublisher && isMember)) {
    return NextResponse.json(
      { error: 'Forbidden: publisher role and committee membership required' },
      { status: 403 }
    );
  }

  // Verify committee exists
  const committee = await prisma.committee.findUnique({ where: { id: committeeId } });
  if (!committee) {
    return NextResponse.json({ error: 'Committee not found' }, { status: 404 });
  }

  // Get max upload size from SystemConfig
  const sizeConfig = await prisma.systemConfig.findUnique({
    where: { key: 'max_upload_size_mb' },
  });
  const maxSizeMb = parseInt(sizeConfig?.value || String(DEFAULT_MAX_SIZE_MB));
  const maxSizeBytes = maxSizeMb * 1024 * 1024;

  // Parse multipart form
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  const title = (formData.get('title') as string | null)?.trim();
  const isNewsletterRaw = formData.get('isNewsletter') as string | null;
  const isNewsletter = isNewsletterRaw === 'true';

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `Invalid file type. Allowed types: PDF, JPG, PNG` },
      { status: 400 }
    );
  }

  // Validate extension
  const originalName = file.name;
  const ext = path.extname(originalName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json(
      { error: `Invalid file extension. Allowed: .pdf, .jpg, .jpeg, .png` },
      { status: 400 }
    );
  }

  // Newsletters must be PDFs
  if (isNewsletter && ext !== '.pdf') {
    return NextResponse.json(
      { error: 'Only PDF files can be marked as newsletters' },
      { status: 400 }
    );
  }

  // Newsletter checkbox is only valid for committees with the newsletter feature
  if (isNewsletter && !committee.hasNewsletterFeature) {
    return NextResponse.json(
      { error: 'This committee does not support newsletter documents' },
      { status: 400 }
    );
  }

  // Validate size
  if (file.size > maxSizeBytes) {
    return NextResponse.json(
      { error: `File too large. Maximum size is ${maxSizeMb} MB` },
      { status: 400 }
    );
  }

  // Sanitize and build unique filename
  const baseName = path.basename(originalName, ext);
  const sanitized = sanitizeFilename(baseName);
  const uniquePrefix = uuidv4().split('-')[0]; // short 8-char prefix
  const finalFilename = `${uniquePrefix}_${sanitized}${ext}`;

  // Build paths
  const committeeDir = path.join(DOCUMENTS_BASE, committeeId);
  const filePath = path.join(committeeDir, finalFilename);
  const relativeFilename = `${committeeId}/${finalFilename}`;

  // Ensure directory exists
  await ensureDir(committeeDir);

  // Write file
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  // Pre-generate the document ID so the thumbnail filename matches
  const documentId = uuidv4();

  // Generate thumbnail if this is a newsletter PDF
  let thumbnailPath: string | null = null;
  if (isNewsletter) {
    thumbnailPath = await generatePdfThumbnail(filePath, documentId);
  }

  // Create Document record
  const document = await prisma.document.create({
    data: {
      id: documentId,
      committeeId,
      title,
      filename: relativeFilename,
      published: false,
      archived: false,
      deleted: false,
      isNewsletter,
      thumbnailPath,
      uploadedBy: session.user.id,
    },
  });

  // Audit log
  await logAuditEvent({
    userId: session.user.id,
    action: 'document_uploaded',
    entityType: 'Document',
    entityId: document.id,
    success: true,
    details: {
      committeeId,
      title,
      filename: relativeFilename,
      fileSize: file.size,
      mimeType: file.type,
      isNewsletter,
      thumbnailGenerated: thumbnailPath !== null,
    },
    ipAddress:
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  });

  return NextResponse.json({ document }, { status: 201 });
}

// GET /api/committees/[id]/documents - List documents for a committee
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: committeeId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      roles: true,
      committees: { select: { id: true } },
    },
  });

  if (!user || user.verificationStatus !== 'verified') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const isAdmin = user.roles.some(r => r.name === 'dbadmin');
  const isPublisher = user.roles.some(r => r.name === 'publisher');
  const isMember = user.committees.some(c => c.id === committeeId);
  const canManage = isAdmin || (isPublisher && isMember);

  // Verify committee exists
  const committee = await prisma.committee.findUnique({ where: { id: committeeId } });
  if (!committee) {
    return NextResponse.json({ error: 'Committee not found' }, { status: 404 });
  }

  let documents;
  if (canManage) {
    // Publishers/admins see all documents including archived and deleted
    documents = await prisma.document.findMany({
      where: { committeeId },
      orderBy: { uploadedAt: 'desc' },
    });
  } else {
    // Regular verified users see only published, non-deleted docs
    documents = await prisma.document.findMany({
      where: { committeeId, published: true, deleted: false },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  return NextResponse.json({
    documents,
    canManage,
    hasNewsletterFeature: committee.hasNewsletterFeature,
  });
}
