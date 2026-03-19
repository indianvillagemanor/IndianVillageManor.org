import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed script...');

  // 1. Create standard roles
  console.log('Creating roles...');
  const roles = [
    { name: 'dbadmin' },
    { name: 'publisher' },
    { name: 'calendar' },
    { name: 'verifier' },
    { name: 'user' },
    { name: 'owner' },
    { name: 'resident' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }
  console.log(`✓ Created ${roles.length} roles`);

  // 2. Create bootstrap user
  console.log('Creating bootstrap user...');
  const bootstrapEmail = 'indianvillagemanor+bootstrap@gmail.com';

  // Get all roles for bootstrap user
  const allRoles = await prisma.role.findMany({
    where: {
      name: {
        in: ['dbadmin', 'user', 'owner', 'verifier'],
      },
    },
  });

  const bootstrapUser = await prisma.user.upsert({
    where: { email: bootstrapEmail },
    update: {
      emailVerified: new Date(), // Ensure emailVerified is set for existing bootstrap user
    },
    create: {
      firstName: 'IVM Bootstrap',
      lastName: 'User',
      email: bootstrapEmail,
      emailVerified: new Date(), // Bootstrap user's email is pre-verified
      phone: '000-000-0000',
      unitNumber: 'None',
      verificationStatus: 'verified',
      roles: {
        connect: allRoles.map((role) => ({ id: role.id })),
      },
    },
  });
  console.log(`✓ Created bootstrap user: ${bootstrapUser.email}`);

  // 3. Create SystemConfig defaults
  console.log('Creating SystemConfig defaults...');
  const systemConfigs = [
    {
      key: 'session_timeout_days',
      value: '90',
      description: 'Session expiration in days',
    },
    {
      key: 'disk_alert_threshold_percent',
      value: '85',
      description: 'Disk usage percentage for alerts',
    },
    {
      key: 'max_upload_size_mb',
      value: '25',
      description: 'Maximum file upload size in MB',
    },
    {
      key: 'audit_log_retention_days',
      value: '365',
      description: 'Retention period for authenticated user audit logs',
    },
    {
      key: 'anonymous_log_retention_days',
      value: '90',
      description: 'Retention period for anonymous audit logs',
    },
    {
      key: 'rate_limit_login_attempts',
      value: '5',
      description: 'Max login attempts before lockout',
    },
    {
      key: 'rate_limit_magic_link_requests',
      value: '3',
      description: 'Max magic link requests per hour',
    },
    {
      key: 'failed_login_alert_threshold',
      value: '3',
      description: 'Failed logins before dbadmin alert',
    },
    {
      key: 'pending_verification_alert_count',
      value: '5',
      description: 'Pending verifications before dbadmin alert',
    },
  ];

  for (const config of systemConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
  }
  console.log(`✓ Created ${systemConfigs.length} SystemConfig entries`);

  // 4. Ensure Communications committee exists
  console.log('Ensuring Communications committee exists...');
  await prisma.committee.upsert({
    where: { id: 'communications' },
    update: {},
    create: {
      id: 'communications',
      name: 'Communications',
      description: 'Community communications and announcements',
      hasNewsletterFeature: false,
    },
  });
  console.log('✓ Communications committee ensured');

  // 5. Create EmailTemplate defaults
  console.log('Creating EmailTemplate defaults...');
  const emailTemplates = [
    {
      key: 'magic-link',
      subject: 'Sign in to Indian Village Manor',
      body: `Hello,

You requested to sign in to the Indian Village Manor website.

Click the link below to sign in:
{{link}}

This link will expire in {{expiresIn}}.

If you did not request this, please ignore this email.

Best regards,
Indian Village Manor`,
      variables: JSON.stringify(['email', 'link', 'expiresIn']),
    },
    {
      key: 'verifier-notification',
      subject: 'New User Registration Pending Verification',
      body: `A new user has registered and requires verification:

Name: {{firstName}} {{lastName}}
Email: {{email}}
Phone: {{phone}}
Unit: {{unit}}
Is Resident: {{isResident}}
Is Owner: {{isOwner}}

Please review and verify this registration:
{{verificationLink}}

Best regards,
Indian Village Manor System`,
      variables: JSON.stringify([
        'firstName',
        'lastName',
        'email',
        'phone',
        'unit',
        'isResident',
        'isOwner',
        'verificationLink',
      ]),
    },
    {
      key: 'approval',
      subject: 'Welcome to Indian Village Manor - Registration Approved',
      body: `Dear {{firstName}} {{lastName}},

Welcome to the Indian Village Manor community portal!

Your registration for Unit {{unit}} has been approved. You can now sign in to access:
- Committee documents
- Event calendar
- Resident directory
- And more

Sign in here: {{loginLink}}

Best regards,
Indian Village Manor`,
      variables: JSON.stringify(['firstName', 'lastName', 'unit', 'loginLink']),
    },
    {
      key: 'denial',
      subject: 'Indian Village Manor Registration - Additional Information Needed',
      body: `Dear {{firstName}} {{lastName}},

Thank you for your interest in the Indian Village Manor community portal.

We need additional information to verify your registration:
{{reason}}

Please contact us:
Email: {{contactEmail}}
Phone: {{contactPhone}}

Best regards,
Indian Village Manor`,
      variables: JSON.stringify([
        'firstName',
        'lastName',
        'reason',
        'contactEmail',
        'contactPhone',
      ]),
    },
    {
      key: 'profile-update-reverify',
      subject: 'Profile Update Requires Re-verification',
      body: `Dear {{firstName}} {{lastName}},

You recently updated your profile information. The following changes require verification:

{{changes}}

Your account has been marked as "pending" until verification is complete. You will receive a notification once your profile has been reviewed.

Best regards,
Indian Village Manor`,
      variables: JSON.stringify(['firstName', 'lastName', 'changes']),
    },
    {
      key: 'email-recovery-unit',
      subject: 'Indian Village Manor - Email Reminder',
      body: `Hello,

You requested to recover your email address for Unit {{unit}}.

The following email(s) are registered for this unit:
{{emails}}

If you did not request this, please contact us immediately.

Best regards,
Indian Village Manor`,
      variables: JSON.stringify(['unit', 'emails']),
    },
  ];

  for (const template of emailTemplates) {
    await prisma.emailTemplate.upsert({
      where: { key: template.key },
      update: {},
      create: template,
    });
  }
  console.log(`✓ Created ${emailTemplates.length} EmailTemplate entries`);

  console.log('\n✅ Seed script completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed script failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
