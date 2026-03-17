import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface PeakDayRow {
  peak_date: string;
  peak_count: bigint;
}

// GET /api/documents/[id]/stats - Return download stats for a document
// Only accessible to publishers who are committee members, or dbadmin.
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: documentId } = await params;

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

  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document || document.deleted) {
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

  // Total download count
  const totalDownloads = await prisma.documentDownload.count({
    where: { documentId },
  });

  // Peak day: the calendar day (server-local date) with the most downloads
  let peakDay: { date: string; count: number } | null = null;

  if (totalDownloads > 0) {
    const rows = await prisma.$queryRaw<PeakDayRow[]>`
      WITH daily AS (
        SELECT
          TO_CHAR("downloadedAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS peak_date,
          COUNT(*) AS peak_count
        FROM "DocumentDownload"
        WHERE "documentId" = ${documentId}
        GROUP BY TO_CHAR("downloadedAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD')
      )
      SELECT peak_date, peak_count FROM daily ORDER BY peak_count DESC LIMIT 1
    `;

    if (rows.length > 0) {
      peakDay = {
        date: rows[0].peak_date,
        count: Number(rows[0].peak_count),
      };
    }
  }

  return NextResponse.json({ totalDownloads, peakDay });
}
