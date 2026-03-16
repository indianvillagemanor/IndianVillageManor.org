import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/newsletters - List all published newsletters (public, no auth required)
export async function GET() {
  const newsletters = await prisma.document.findMany({
    where: {
      isNewsletter: true,
      published: true,
      deleted: false,
    },
    orderBy: { uploadedAt: 'desc' },
    select: {
      id: true,
      title: true,
      uploadedAt: true,
      thumbnailPath: true,
    },
  });

  return NextResponse.json({ newsletters });
}
