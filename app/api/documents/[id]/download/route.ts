import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isBot } from '@/lib/audit';
import { normalizeDownloadFilename } from '@/lib/sanitize';
import path from 'path';
import fs from 'fs/promises';

const DOCUMENTS_BASE = '/data/documents';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/documents/[id]/download - Serve a document file
// Published newsletters are accessible to all users (including anonymous).
// All other documents require a verified, authenticated session.
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: documentId } = await params;

  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  // Deleted documents are never accessible
  if (document.deleted) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  // Published newsletters and explicitly public documents are accessible without auth
  const isPublicNewsletter = document.isNewsletter && document.published;
  const isPublicDocument = document.isPublic && document.published;

  if (!isPublicNewsletter && !isPublicDocument) {
    // All other documents require authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    const isMember = user.committees.some(c => c.id === document.committeeId);
    const canManage = isAdmin || (isPublisher && isMember);

    // If not published: only publisher+member or admin can access
    // If published or archived: any verified user can access
    if (!document.published && !document.archived && !canManage) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
  }

  // Build safe file path - validate that it starts with the documents base
  const filePath = path.join(DOCUMENTS_BASE, document.filename);
  const resolvedPath = path.resolve(filePath);
  const resolvedBase = path.resolve(DOCUMENTS_BASE);

  if (!resolvedPath.startsWith(resolvedBase + path.sep)) {
    return NextResponse.json({ error: 'Invalid document path' }, { status: 400 });
  }

  // Read file
  let fileBuffer: Buffer;
  try {
    await fs.access(resolvedPath);
    fileBuffer = Buffer.from(await fs.readFile(resolvedPath));
  } catch {
    return NextResponse.json({ error: 'File not found on disk' }, { status: 404 });
  }

  // Determine content type
  const ext = path.extname(document.filename).toLowerCase();
  const contentTypeMap: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
  };
  const contentType = contentTypeMap[ext] || 'application/octet-stream';

  const filename = normalizeDownloadFilename(path.basename(document.filename));
  const encodedFilename = encodeURIComponent(filename);

  const cacheControl = (isPublicNewsletter || isPublicDocument)
    ? 'public, max-age=86400'
    : 'private, no-store';

  // Record download stat (skip bots; non-blocking so it never delays the response)
  const userAgent = request.headers.get('user-agent') || '';
  if (!isBot(userAgent)) {
    prisma.documentDownload.create({ data: { documentId } }).catch((err) => {
      console.error('Failed to record document download stat:', err);
    });
  }

  return new NextResponse(new Uint8Array(fileBuffer), {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
      'Content-Length': String(fileBuffer.length),
      'Cache-Control': cacheControl,
    },
  });
}
