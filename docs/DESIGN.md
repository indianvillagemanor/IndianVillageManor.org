# Indian Village Manor - Design Specification

Purpose
-------
A concise, developer-oriented design document for the Indian Village Manor website (8120 E Jefferson Ave, Detroit, MI 48214). This replaces earlier drafts and is written so engineers can implement, test, and operate the system.

Summary (high level)
--------------------
- Static marketing site + authenticated resident/owner portal.
- Authentication: SSO (multiple providers) with email magic-link fallback.
- Roles: resident, owner, dbadmin, publisher, calendar, verifier.
- Features: user registration, document publishing per-committee, event calendar, audit logs, containerized deployment with persistent volume and backups.
- Tech stack (baseline): Next.js, NextAuth, TailwindCSS, Zod, PostgreSQL, Prisma, nodemailer.

Goals and Scope
---------------
- Public: marketing pages, current and future events, contact info, floorplans.
- Authenticated users: access to published documents, member-only past events, publisher and calendar management UIs.
- Admin: dbadmin can modify roles and committee membership.
- Persistent file storage via container-mounted volume; periodic off-site backups.

Primary Business Rules
----------------------
1. Registration requires: first name, last name, unit number (alphanumeric, up to 6 characters), phone, email, and at least one of {resident, owner}.
2. Roles and committee membership can only be changed by dbadmin.
3. A user may belong to multiple committees (many-to-many relationship).
4. Only published documents are visible to logged-in verified users; non-logged-in users cannot access user-only areas.
5. Public view: current and future events (within the calendar month) are public; past events (older than start of current calendar month) require login.
6. Publisher role is scoped to committee membership - any user with the publisher role can upload, archive, restore, or delete documents only for committees where they are a member.
7. Menu behavior:
   - Non-logged-in: hamburger shows Login.
   - Logged-in verified users: menu shows links to committee pages that either (a) have at least one published document, or (b) the user is a publisher or member of (even if empty).
   - Calendar link appears in menu only when events exist and user has appropriate access.
8. Audit log: every user action is recorded with user name and unit (or anonymous), action type, file(s), and extra metadata.
   - Anonymous logs track visit counts for main-page and external-document access (subtract robots if possible).
   - Audit logs are written to container-mounted volume for easy backup.
9. Registration verification:
  - New registrations are placed in a pending verification state and cannot log in.
  - Pending users attempting to log in see appropriate messaging explaining verification is required.
  - Verifiers can approve or deny a registration and leave a comment.
  - Verified users can access all user-only areas.
  - Denied users receive an email with next steps (contact office or re-register with correct information).
10. User profile updates:
  - Verified users can update their profile information after login.
  - Any changes to firstName, lastName, unitNumber, phone, or resident/owner status will revert verification status to pending.
  - Users are notified of re-verification requirement and given option to cancel changes to maintain verified status.

Data Model (recommended / Prisma style)
--------------------------------------
See [DATABASE.md](./DATABASE.md) for detailed schema documentation.

model User {
  id            String   @id @default(uuid())
  firstName     String
  lastName      String
  email         String   @unique
  phone         String
  unitNumber    String   // alphanumeric, max 6 characters
  isResident    Boolean
  isOwner       Boolean
  verificationStatus String // pending, verified, denied
  verificationUpdatedAt DateTime?
  verificationUpdatedBy String?  // User.id reference
  verificationComment  String?
  roles         Role[]   @relation("UserRoles")
  committees    Committee[] @relation("Memberships")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Role {
  id    String @id @default(uuid())
  name  String @unique // dbadmin, publisher, calendar, verifier
  users User[] @relation("UserRoles")
}

model Committee {
  id          String   @id @default(uuid())
  name        String
  description String?
  members     User[]   @relation("Memberships")
  documents   Document[]
}

model Document {
  id           String    @id @default(uuid())
  committeeId  String
  committee    Committee @relation(fields: [committeeId], references: [id])
  title        String
  filename     String    // path within mounted volume
  published    Boolean   @default(false)
  archived     Boolean   @default(false)
  deleted      Boolean   @default(false)
  uploadedBy   String    // User.id reference
  uploadedAt   DateTime  @default(now())
  deletedBy    String?   // User.id reference
  deletedAt    DateTime?
}

model Event {
  id          String   @id @default(uuid())
  title       String
  description String?
  startAt     DateTime
  endAt       DateTime?
  createdBy   String   // User.id reference
  createdAt   DateTime @default(now())
  updatedBy   String?  // User.id reference
  updatedAt   DateTime @updatedAt
}

model AuditLog {
  id         String   @id @default(uuid())
  userId     String?  // User.id reference or null for anonymous
  actor      String?  // "firstName lastName (Unit: X)" or "anonymous"
  unit       String?
  action     String
  target     String?  // filename / event id / api route
  meta       Json?
  createdAt  DateTime @default(now())
}

model SystemConfig {
  id          String   @id @default(uuid())
  key         String   @unique
  value       String
  description String?
  updatedBy   String?  // User.id reference
  updatedAt   DateTime @updatedAt
}

model EmailTemplate {
  id          String   @id @default(uuid())
  key         String   @unique  // magic-link, verifier-notification, approval, denial, etc.
  subject     String
  body        String   @db.Text
  variables   String?  // JSON array of available template variables
  updatedBy   String?  // User.id reference
  updatedAt   DateTime @updatedAt
}

Key constraints
- Users must have isResident OR isOwner (validation at registration).
- Publisher permissions are scoped to committee membership (many-to-many).
- unitNumber: alphanumeric, maximum 6 characters.
- User references (uploadedBy, createdBy, etc.) should use User.id for data integrity.

Authentication and Authorization
--------------------------------
- Primary: OAuth SSO providers (configurable list) via NextAuth.
- Fallback: email magic-link (nodemailer).
- Registration flow:
  - Require firstName, lastName, email, phone, unitNumber (alphanumeric, max 6 chars, manually verified), and at least one of {resident, owner}.
  - New registrations are created with verificationStatus = "pending" and CANNOT log in.
  - Pending users attempting to log in see messaging that verification is required.
  - Email all users with verifier role about the registration attempt, including a link to verify or deny the user.
  - Upon approval, send confirmation email to user and set verificationStatus = "verified".
  - Upon denial, send email with next steps (contact office or re-register with correct information).
- Forgot email recovery:
  - Option 1: Challenge user to complete partial email address, then continue sign-on.
  - Option 2: Enter unit number, send reminder email to all verified users in that unit.
- Session rules:
  - Secure HTTP-only cookies
  - Session expiry default: 90 days (configurable by dbadmin via SystemConfig)
  - Rate limiting on login and magic-link requests (implemented in authentication layer)
  - Users can stay logged in for configured duration
- Authorization: middleware in Next.js API routes and page-level checks using role membership and committee associations.
- Email templates: customizable by dbadmin through EmailTemplate management UI.

Document Lifecycle and Storage
-------------------------------
- Storage: mounted container volume (e.g., /data/documents) for persistent files.
- Document states:
  - Published: accessible via URL and listed on committee page for verified users.
  - Archived: existing links continue to work but document is not listed on committee page.
  - Deleted: moved to committee-specific "trash" folder, not publicly accessible.
- Publishers (with committee membership) can:
  - Upload new documents
  - Publish documents (make visible on committee page)
  - Archive documents (remove from listings but keep links working)
  - Delete documents (move to committee trash)
  - Restore archived or deleted documents for their committees only
- Upload controls: file type whitelist (pdf, jpg, png), size limit (25 MB), virus/scan check recommended.
- UI: publisher who is a member of a committee sees Upload, Archive, Delete, and Restore actions on that committee's page.

Event Calendar
--------------
- Public: current and future events (within and after current calendar month) viewable by anyone.
  - Example: If today is Jan 15 or Jan 31, show January events and later (not December).
- Protected: past events (older than start of current calendar month) require verified login.
- Calendar role: full CRUD on events via UI and API.

Audit and Logging
-----------------
- Log structure: userId (if authenticated), actor ("firstName lastName (Unit: X)" or "anonymous"), unit, action, target, meta, timestamp.
- Logs written to container-mounted volume (/data/logs) for easy backup.
- Anonymous logs track visit counts for main-page and external-document access.
  - Subtract robot/bot traffic if possible (use user-agent detection).
  - HTTP server logs contain detailed request information; audit logs track high-level visit counts.
- Authenticated logs for all user actions:
  - Login/logout
  - Document actions (upload, publish, archive, delete, restore)
  - Event actions (create, edit, delete)
  - Admin actions (role changes, membership changes, system config updates)
  - Verification actions (approve, deny)
  - Profile updates
- Retention: configurable (recommend 12 months for audit logs; 90 days for anonymous access logs).

Backup and Deployment
---------------------
- Containerized deployment (Docker or Docker Compose).
- Nginx reverse proxy to route requests to the app and static assets.
- HTTPS: automatically configure and renew certificates via Let's Encrypt when HTTPS is not already enabled.
- Persistent external volume mounts for:
  - PostgreSQL data
  - Uploaded documents (/data/documents)
  - Audit logs (/data/logs)
  - Optional: server settings or config
- Backup strategy: periodic snapshot copy of mounted volumes to off-site (e.g., Google Drive or S3).
  - Recommend daily incremental and weekly full backups
  - Keep 30-day rotation
  - Encrypt backups
- Database migrations: See [DATABASE_MIGRATIONS.md](./DATABASE_MIGRATIONS.md) for deployment strategy.
- Environment vars: DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, SMTP_URL, STORAGE_PATH, BACKUP_CRON, etc.

Monitoring and Alerting
-----------------------
- Dbadmin receives email notifications for:
  - Failed email deliveries (magic-link, verifications, notifications)
  - Failed login attempts by a user > 3
  - Pending verifications count increase
  - Disk usage above configurable threshold (default: 85%, adjustable via SystemConfig)
  - Application errors and warnings
- Metrics to track:
  - Failed login attempts per user
  - Pending verifications count
  - Document upload success/failure rates
  - Email delivery success/failure rates
  - Disk usage for document and log volumes
  - Database connection pool status
- Alert thresholds configurable by dbadmin via SystemConfig table.


Testing, CI, and Quality
------------------------
- Unit tests: auth logic, role checks, form validation (Zod), utility functions.
- Integration tests: document upload, event CRUD, menu visibility rules, API routes, database operations.
- E2E tests: written alongside features, covering:
  - Registration and magic-link login
  - SSO flows
  - Verifier workflow
  - Document management
  - Profile updates
- Migration tests: database migration rollback verification.
- CI pipeline: lint → typecheck → unit tests → integration tests → build → E2E tests → produce container image.
- Coverage target: >80% for critical paths.

Operational and Security Notes
------------------------------
- Validate and sanitize all file names and user input.
- Rate-limit login and magic-link requests (prevent brute force and spam).
- Ensure backups are encrypted and access-controlled.
- Limit access to volumes and database credentials.
- Monitor disk usage for upload and log volumes; alert dbadmin when above threshold.
- Session timeout: 90 days default, low security risk justifies long duration for user convenience.
- Failed email notifications sent to dbadmin for operational awareness.
- Track failed login attempts per user; alert dbadmin after >3 failures.

Migration and Reuse
-------------------
- Reuse code from IndianVillageManor/ivm_app (Next.js + NextAuth + Prisma).
- Provide scripts to migrate Users, Committees, Documents, and Events into the new schema.

MVP Checklist (priority)
------------------------
1. Public static site + current and future events display.
2. Registration + magic-link login flow (pending users cannot log in).
3. Verifier workflow: email notifications, approval/denial with comments.
4. User profile management with re-verification on changes.
5. Verified user access to published documents.
6. Publisher upload, publish, archive, delete, restore for committee documents.
7. Calendar CRUD for events.
8. Dbadmin console for role and committee assignments.
9. Dbadmin UI for email template customization.
10. Dbadmin bulk operations for user management.
11. Basic audit logging (early) and comprehensive logging (later).
12. Monitoring and alerting with email notifications to dbadmin.
13. Containerized deployment + persistent volumes + nightly encrypted backup.

Acceptance Criteria
-------------------
- Users can register with firstName, lastName, email, phone, unitNumber, and resident/owner status.
- Pending users cannot log in and see appropriate messaging when attempting to do so.
- New registrations trigger email notifications to all verifiers.
- Verifiers can approve or deny registrations with comments.
- Approved users receive confirmation email and can access all verified-user areas.
- Denied users receive email with next steps (contact office or re-register).
- Users can log in via magic-link and SSO with fallback.
- Forgot email recovery: partial email challenge or unit-based reminder email.
- Verified users can update profiles; changes revert verification with cancellation option.
- Publishers can upload, publish, archive, delete, and restore documents for their committee memberships only.
- Archived documents: links work but not listed on pages.
- Deleted documents: moved to committee-specific trash, can be restored by committee publishers.
- Events: current calendar month and future events are public; past events require verified login.
- Dbadmin can manage roles, committee memberships, system configuration, and email templates.
- Dbadmin can perform bulk operations on users.
- Audit logs written to volume, tracking all user actions and anonymous visit counts.
- Dbadmin receives email alerts for failures, errors, warnings, and threshold breaches.
- Backups (database + documents + logs) complete on schedule, encrypted, and restorable.
- Database migrations can be rolled back safely.

Open Questions / Configurable Items
-----------------------------------
- Exact list of SSO providers to support (Google, Microsoft, etc.).
- Retention and archival policy for audit logs and documents.
- Max allowed upload size (recommend 25 MB) and exact permitted file types (recommend: pdf, jpg, png).

Implementation Notes / Next Tasks
---------------------------------
1. Create [DATABASE.md](./DATABASE.md) with complete schema documentation.
2. Create [DATABASE_MIGRATIONS.md](./DATABASE_MIGRATIONS.md) with migration deployment strategy.
3. Create Prisma schema models (User, Role, Committee, Document, Event, AuditLog, SystemConfig, EmailTemplate) and run migrations.
4. Implement NextAuth with SSO + magic-link, rate limiting, and validation on registration.
5. Implement basic audit logging early (write to /data/logs volume).
6. Build user profile management UI with re-verification flow.
7. Build committee and document UI and APIs with role checks.
8. Implement document restore functionality and committee trash.
9. Build dbadmin console:
   - Role and committee assignments
   - Bulk operations for users
   - Email template customization UI
   - System configuration (session timeout, alert thresholds)
10. Implement monitoring and email alerting to dbadmin.
11. Add container + volume compose file (documents, logs, database) and encrypted backup cron job.
12. Implement migration rollback tests.
