import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/committees/visible
 * Returns committees visible to the current authenticated user
 *
 * Visibility rules:
 * - dbadmin: all committees (with counts)
 * - Committees with published documents (visible to all verified users)
 * - Committees where user is a member (visible even if no published docs)
 * - Committees where user has publisher role (visible even if no published docs)
 */
export async function GET() {
  try {
    // Get current user session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with roles and committee memberships
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        roles: true,
        committees: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isAdmin = user.roles.some(role => role.name === 'dbadmin');
    const hasPublisherRole = user.roles.some(role => role.name === 'publisher');

    // Get user's committee memberships
    const userCommitteeIds = user.committees.map(c => c.id);

    // Build visibility query
    const whereClause = isAdmin
      ? {} // admins see all committees (including archived)
      : {
          archived: false,
          OR: [
            // Committees with published documents (visible to all verified users)
            {
              documents: {
                some: {
                  published: true,
                  deleted: false,
                },
              },
            },
            // Committees where user is a member
            {
              id: {
                in: userCommitteeIds,
              },
            },
            // If user has publisher role, show all committees
            ...(hasPublisherRole ? [{}] : []),
          ],
        };

    const committees = await prisma.committee.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        description: true,
        _count: {
          select: {
            members: true,
            documents: {
              where: { deleted: false, published: true },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    const result = committees.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      memberCount: c._count.members,
      documentCount: c._count.documents,
    }));

    return NextResponse.json({ committees: result });
  } catch (error) {
    console.error('[API] Error fetching visible committees:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

