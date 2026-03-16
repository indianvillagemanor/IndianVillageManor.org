import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail, replaceTemplateVariables } from '@/lib/email';
import { logAuditEvent } from '@/lib/audit';
import { sendVerifierNotification } from '@/lib/notifications';

// Fields that trigger re-verification when changed
// firstName, lastName, unitNumber, phone, and role changes all trigger re-verification

// GET: Fetch current user's profile
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { roles: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      unitNumber: user.unitNumber,
      verificationStatus: user.verificationStatus,
      isResident: user.roles.some(r => r.name === 'resident'),
      isOwner: user.roles.some(r => r.name === 'owner'),
      isVerifier: user.roles.some(r => r.name === 'verifier'),
      createdAt: user.createdAt.toISOString(),
    },
  });
}

// PUT: Update user profile
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { roles: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const body = await request.json();
  const { firstName, lastName, phone, unitNumber, isResident, isOwner } = body;

  // Validate required fields
  if (!firstName || !lastName || !phone || !unitNumber) {
    return NextResponse.json(
      { error: 'firstName, lastName, phone, and unitNumber are required' },
      { status: 400 }
    );
  }

  if (firstName.length > 100 || lastName.length > 100) {
    return NextResponse.json(
      { error: 'Name fields must be 100 characters or less' },
      { status: 400 }
    );
  }

  if (unitNumber.length > 6) {
    return NextResponse.json(
      { error: 'Unit number must be 6 characters or less' },
      { status: 400 }
    );
  }

  if (!isResident && !isOwner) {
    return NextResponse.json(
      { error: 'At least one of resident or owner must be selected' },
      { status: 400 }
    );
  }

  // Determine which fields changed
  const currentIsResident = user.roles.some(r => r.name === 'resident');
  const currentIsOwner = user.roles.some(r => r.name === 'owner');

  const changes: string[] = [];
  if (firstName !== user.firstName) changes.push(`First name: "${user.firstName}" → "${firstName}"`);
  if (lastName !== user.lastName) changes.push(`Last name: "${user.lastName}" → "${lastName}"`);
  if (phone !== user.phone) changes.push(`Phone: "${user.phone}" → "${phone}"`);
  if (unitNumber.toUpperCase() !== user.unitNumber) changes.push(`Unit: "${user.unitNumber}" → "${unitNumber.toUpperCase()}"`);
  if (isResident !== currentIsResident) changes.push(`Resident: ${currentIsResident ? 'Yes' : 'No'} → ${isResident ? 'Yes' : 'No'}`);
  if (isOwner !== currentIsOwner) changes.push(`Owner: ${currentIsOwner ? 'Yes' : 'No'} → ${isOwner ? 'Yes' : 'No'}`);

  if (changes.length === 0) {
    return NextResponse.json({ success: true, message: 'No changes detected', reverify: false });
  }

  // Check if any re-verification triggering fields changed
  const needsReverify =
    firstName !== user.firstName ||
    lastName !== user.lastName ||
    phone !== user.phone ||
    unitNumber.toUpperCase() !== user.unitNumber ||
    isResident !== currentIsResident ||
    isOwner !== currentIsOwner;

  const wasVerified = user.verificationStatus === 'verified';
  // Verifiers can edit their own profile freely without triggering re-verification
  const isVerifier = user.roles.some(r => r.name === 'verifier');
  const willReverify = needsReverify && wasVerified && !isVerifier;

  // Update user data
  const updateData: Record<string, unknown> = {
    firstName,
    lastName,
    phone,
    unitNumber: unitNumber.toUpperCase(),
  };

  if (willReverify) {
    updateData.verificationStatus = 'pending';
    updateData.verificationUpdatedAt = new Date();
    updateData.verificationComment = `Profile update requires re-verification. Changes: ${changes.join('; ')}`;
  }

  // Update roles
  const residentRole = await prisma.role.findUnique({ where: { name: 'resident' } });
  const ownerRole = await prisma.role.findUnique({ where: { name: 'owner' } });

  const roleConnect: { id: string }[] = [];
  const roleDisconnect: { id: string }[] = [];

  if (residentRole) {
    if (isResident && !currentIsResident) roleConnect.push({ id: residentRole.id });
    if (!isResident && currentIsResident) roleDisconnect.push({ id: residentRole.id });
  }
  if (ownerRole) {
    if (isOwner && !currentIsOwner) roleConnect.push({ id: ownerRole.id });
    if (!isOwner && currentIsOwner) roleDisconnect.push({ id: ownerRole.id });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...updateData,
      ...(roleConnect.length > 0 ? { roles: { connect: roleConnect } } : {}),
    },
  });

  // Handle role disconnections separately
  if (roleDisconnect.length > 0) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        roles: { disconnect: roleDisconnect },
      },
    });
  }

  // Audit log
  await logAuditEvent({
    userId: session.user.id,
    action: 'profile_updated',
    entityType: 'User',
    entityId: session.user.id,
    success: true,
    details: {
      changes,
      reverify: willReverify,
    },
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  });

  // If re-verification needed, send notifications
  if (willReverify) {
    // Send profile-update-reverify email to user
    const template = await prisma.emailTemplate.findUnique({
      where: { key: 'profile-update-reverify' },
    });

    if (template) {
      const emailBody = replaceTemplateVariables(template.body, {
        firstName,
        lastName,
        changes: changes.join('\n'),
      });

      sendEmail({
        to: user.email,
        subject: template.subject,
        text: emailBody,
        html: emailBody.replace(/\n/g, '<br>'),
      }).catch(err => console.error('Failed to send profile-update-reverify email:', err));
    }

    // Notify verifiers of re-verification need
    sendVerifierNotification({
      id: user.id,
      firstName,
      lastName,
      email: user.email,
      phone,
      unitNumber: unitNumber.toUpperCase(),
      roles: [
        ...(isResident ? ['resident'] : []),
        ...(isOwner ? ['owner'] : []),
      ],
    }).catch(err => console.error('Failed to send verifier notification for profile update:', err));
  }

  return NextResponse.json({
    success: true,
    message: willReverify
      ? 'Profile updated. Your account requires re-verification.'
      : 'Profile updated successfully.',
    reverify: willReverify,
    changes,
  });
}
