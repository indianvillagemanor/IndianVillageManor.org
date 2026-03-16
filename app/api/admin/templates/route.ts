import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/templates - List all email templates
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { roles: true },
  });

  if (!admin || !admin.roles.some(r => r.name === 'dbadmin')) {
    return NextResponse.json({ error: 'Forbidden: dbadmin role required' }, { status: 403 });
  }

  const templates = await prisma.emailTemplate.findMany({
    orderBy: { key: 'asc' },
  });

  return NextResponse.json({
    templates: templates.map(t => ({
      id: t.id,
      key: t.key,
      subject: t.subject,
      body: t.body,
      variables: t.variables ? JSON.parse(t.variables) : [],
      updatedBy: t.updatedBy,
      updatedAt: t.updatedAt.toISOString(),
    })),
  });
}
