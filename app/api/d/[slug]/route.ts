import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isBot } from '@/lib/audit';
import { normalizeDownloadFilename } from '@/lib/sanitize';
import path from 'path';
import fs from 'fs/promises';

const DOCUMENTS_BASE = '/data/documents';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET /api/d/[slug] - Serve a publicly-accessible document by its short slug.
// No authentication required. Document must be isPublic=true, published=true, and not deleted.
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;

  const document = await prisma.document.findUnique({ where: { publicSlug: slug } });

  if (!document || document.deleted || !document.isPublic || !document.published) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  // Build safe file path
  const filePath = path.join(DOCUMENTS_BASE, document.filename);
  const resolvedPath = path.resolve(filePath);
  const resolvedBase = path.resolve(DOCUMENTS_BASE);

  if (!resolvedPath.startsWith(resolvedBase + path.sep)) {
    return NextResponse.json({ error: 'Invalid document path' }, { status: 400 });
  }

  let fileBuffer: Buffer;
  try {
    await fs.access(resolvedPath);
    fileBuffer = Buffer.from(await fs.readFile(resolvedPath));
  } catch {
    return NextResponse.json({ error: 'File not found on disk' }, { status: 404 });
  }

  const ext = path.extname(document.filename).toLowerCase();
  const contentTypeMap: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
  };
  const contentType = contentTypeMap[ext] || 'application/octet-stream';

  // Use the slug itself as the download filename so the browser suggests a sensible name
  const encodedFilename = encodeURIComponent(normalizeDownloadFilename(slug));

  // Record download stat (non-blocking, skip bots)
  const userAgent = request.headers.get('user-agent') || '';
  if (!isBot(userAgent)) {
    prisma.documentDownload.create({ data: { documentId: document.id } }).catch((err) => {
      console.error('Failed to record document download stat:', err);
    });
  }

  return new NextResponse(new Uint8Array(fileBuffer), {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
      'Content-Length': String(fileBuffer.length),
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
