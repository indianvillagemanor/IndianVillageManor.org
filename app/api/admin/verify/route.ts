import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail, replaceTemplateVariables } from '@/lib/email';
import { logAuditEvent } from '@/lib/audit';
import { createMagicLink } from '@/lib/magic-link';

// GET: List pending users for verifier dashboard
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has verifier role
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { roles: true },
  });

  if (!user || !user.roles.some(r => r.name === 'verifier')) {
    return NextResponse.json({ error: 'Forbidden: verifier role required' }, { status: 403 });
  }

  // Fetch pending users
  const pendingUsers = await prisma.user.findMany({
    where: { verificationStatus: 'pending' },
    include: { roles: true },
    orderBy: { createdAt: 'asc' },
  });

  const users = pendingUsers.map(u => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phone: u.phone,
    unitNumber: u.unitNumber,
    isResident: u.roles.some(r => r.name === 'resident'),
    isOwner: u.roles.some(r => r.name === 'owner'),
    createdAt: u.createdAt.toISOString(),
  }));

  return NextResponse.json({ users });
}

// POST: Approve or deny a pending user
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has verifier role
  const verifier = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { roles: true },
  });

  if (!verifier || !verifier.roles.some(r => r.name === 'verifier')) {
    return NextResponse.json({ error: 'Forbidden: verifier role required' }, { status: 403 });
  }

  const body = await request.json();
  const { userId, action, comment } = body;

  if (!userId || !action) {
    return NextResponse.json({ error: 'userId and action are required' }, { status: 400 });
  }

  if (action !== 'approve' && action !== 'deny') {
    return NextResponse.json({ error: 'action must be "approve" or "deny"' }, { status: 400 });
  }

  // Fetch the target user
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: true },
  });

  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (targetUser.verificationStatus !== 'pending') {
    return NextResponse.json(
      { error: `User is already ${targetUser.verificationStatus}` },
      { status: 400 }
    );
  }

  const newStatus = action === 'approve' ? 'verified' : 'denied';

  // Update user verification status
  await prisma.user.update({
    where: { id: userId },
    data: {
      verificationStatus: newStatus,
      verificationUpdatedAt: new Date(),
      verificationUpdatedBy: session.user.id,
      verificationComment: comment || null,
    },
  });

  // If approving, also assign the 'user' role
  if (action === 'approve') {
    const userRole = await prisma.role.findUnique({ where: { name: 'user' } });
    if (userRole) {
      const hasUserRole = targetUser.roles.some(r => r.name === 'user');
      if (!hasUserRole) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            roles: { connect: { id: userRole.id } },
          },
        });
      }
    }
  }

  // Send approval/denial email
  const templateKey = action === 'approve' ? 'approval' : 'denial';
  const template = await prisma.emailTemplate.findUnique({
    where: { key: templateKey },
  });

  if (template) {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const variables: Record<string, string> = {
      firstName: targetUser.firstName,
      lastName: targetUser.lastName,
      unit: targetUser.unitNumber,
    };

    if (action === 'approve') {
      // Generate a one-time magic link so the user is logged in automatically
      try {
        variables.loginLink = await createMagicLink(targetUser.email, `${baseUrl}/dashboard`);
      } catch (linkError) {
        console.error(`Failed to create magic link for approved user ${targetUser.email}:`, linkError);
        variables.loginLink = `${baseUrl}/auth/login`;
      }
    } else {
      variables.reason = comment || 'Your registration could not be verified at this time.';
      variables.contactEmail = process.env.EMAIL_FROM || 'noreply@indianvillagemanor.org';
      variables.contactPhone = '(313) 555-0100';
    }

    const emailBody = replaceTemplateVariables(template.body, variables);

    try {
      await sendEmail({
        to: targetUser.email,
        subject: template.subject,
        text: emailBody,
        html: emailBody.replace(/\n/g, '<br>'),
      });
    } catch (error) {
      console.error(`Failed to send ${templateKey} email to ${targetUser.email}:`, error);
    }
  }

  // Audit log
  await logAuditEvent({
    userId: session.user.id,
    action: action === 'approve' ? 'user_approved' : 'user_denied',
    entityType: 'User',
    entityId: userId,
    success: true,
    details: {
      verifierEmail: verifier.email,
      targetEmail: targetUser.email,
      comment: comment || null,
      newStatus,
    },
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  });

  return NextResponse.json({
    success: true,
    message: `User ${action === 'approve' ? 'approved' : 'denied'} successfully`,
    userId,
    newStatus,
  });
}
