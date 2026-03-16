import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import path from 'path';
import fs from 'fs/promises';

const DOCUMENTS_BASE = '/data/documents';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/newsletters/[id]/thumbnail - Serve newsletter thumbnail (public, no auth required)
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id: documentId } = await params;

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      isNewsletter: true,
      published: true,
      deleted: true,
      thumbnailPath: true,
    },
  });

  if (!document || !document.isNewsletter || document.deleted || !document.published) {
    return NextResponse.json({ error: 'Thumbnail not found' }, { status: 404 });
  }

  if (!document.thumbnailPath) {
    return NextResponse.json({ error: 'No thumbnail available' }, { status: 404 });
  }

  // Build safe file path - validate that it starts with the documents base
  const filePath = path.join(DOCUMENTS_BASE, document.thumbnailPath);
  const resolvedPath = path.resolve(filePath);
  const resolvedBase = path.resolve(DOCUMENTS_BASE);

  if (!resolvedPath.startsWith(resolvedBase + path.sep) && resolvedPath !== resolvedBase) {
    return NextResponse.json({ error: 'Invalid thumbnail path' }, { status: 400 });
  }

  let fileBuffer: Buffer;
  try {
    await fs.access(resolvedPath);
    fileBuffer = Buffer.from(await fs.readFile(resolvedPath));
  } catch {
    return NextResponse.json({ error: 'Thumbnail file not found' }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(fileBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': String(fileBuffer.length),
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
