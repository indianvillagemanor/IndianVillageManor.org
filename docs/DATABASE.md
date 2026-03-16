# Indian Village Manor - Database Schema Documentation

## Overview

This document provides detailed documentation of the database schema for the Indian Village Manor website. The database uses PostgreSQL with Prisma ORM for type-safe database access.

## Models

### User

Represents a resident or owner of the Indian Village Manor.

```prisma
model User {
  id                     String    @id @default(uuid())
  firstName              String
  lastName               String
  email                  String    @unique
  phone                  String
  unitNumber             String    // alphanumeric, max 6 characters
  verificationStatus     String    // "pending", "verified", "denied"
  verificationUpdatedAt  DateTime?
  verificationUpdatedBy  String?   // User.id reference
  verificationComment    String?
  roles                  Role[]    @relation("UserRoles")
  committees             Committee[] @relation("Memberships")
  createdAt              DateTime  @default(now())
  updatedAt              DateTime  @updatedAt
}
```

**Fields**:
- `id`: UUID primary key
- `firstName`: User's first name (required)
- `lastName`: User's last name (required)
- `email`: Unique email address for authentication
- `phone`: Phone number (required)
- `unitNumber`: Unit number in the manor (alphanumeric, max 6 characters, manually verified)
- `verificationStatus`: Current verification state - "pending", "verified", or "denied"
- `verificationUpdatedAt`: Timestamp of last verification status change
- `verificationUpdatedBy`: User ID of verifier who updated the status
- `verificationComment`: Optional comment from verifier
- `roles`: Many-to-many relationship with Role model (includes "owner" and "resident" roles)
- `committees`: Many-to-many relationship with Committee model
- `createdAt`: Timestamp of user registration
- `updatedAt`: Timestamp of last profile update

**Constraints**:
- Email must be unique
- User must have at least one role assigned from registration form ("owner" and/or "resident")
- unitNumber must be alphanumeric and maximum 6 characters
- verificationStatus must be one of: "pending", "verified", "denied"

**Owner and Resident Roles**:
- During registration, users select whether they are an owner, resident, or both
- The application assumes these selections are correct but unverified
- The "owner" and "resident" roles are assigned based on registration form selections
- Verifiers review and can modify role assignments during the verification process

**Indexes**:
- Primary: `id`
- Unique: `email`
- Recommended: `verificationStatus`, `unitNumber` (for queries)

---

### Role

Defines system roles for authorization.

```prisma
model Role {
  id    String @id @default(uuid())
  name  String @unique
  users User[] @relation("UserRoles")
}
```

**Standard Roles**:
- `dbadmin`: Database administrator, full system access
- `publisher`: Can publish documents for committees they are a member of
- `calendar`: Can create, edit, and delete events
- `verifier`: Can approve or deny user registrations
- `user`: Base user role (typically assigned automatically)
- `owner`: Owner role (assigned based on registration form selection, verified by verifier)
- `resident`: Resident role (assigned based on registration form selection, verified by verifier)

**Fields**:
- `id`: UUID primary key
- `name`: Unique role name
- `users`: Many-to-many relationship with User model

**Constraints**:
- Name must be unique

**Notes**:
- Roles are many-to-many with users (a user can have multiple roles)
- Publisher role is scoped by committee membership

---

### Committee

Represents committees within the manor (e.g., Board, Architectural, Social).

```prisma
model Committee {
  id          String     @id @default(uuid())
  name        String
  description String?
  members     User[]     @relation("Memberships")
  documents   Document[]
}
```

**Fields**:
- `id`: UUID primary key
- `name`: Committee name
- `description`: Optional description of committee purpose
- `members`: Many-to-many relationship with User model
- `documents`: One-to-many relationship with Document model

**Notes**:
- Committee membership is many-to-many (users can be on multiple committees)
- Publishers can only upload documents to committees where they are members

---

### Document

Represents uploaded documents associated with committees.

```prisma
model Document {
  id          String    @id @default(uuid())
  committeeId String
  committee   Committee @relation(fields: [committeeId], references: [id])
  title       String
  filename    String    // path within mounted volume
  published   Boolean   @default(false)
  archived    Boolean   @default(false)
  deleted     Boolean   @default(false)
  uploadedBy  String    // User.id reference
  uploadedAt  DateTime  @default(now())
  deletedBy   String?   // User.id reference
  deletedAt   DateTime?
}
```

**Fields**:
- `id`: UUID primary key
- `committeeId`: Foreign key to Committee
- `committee`: Relationship to Committee model
- `title`: Document title
- `filename`: File path within mounted volume (e.g., /data/documents/committee-id/filename.pdf)
- `published`: Boolean flag - if true, document is listed on committee page
- `archived`: Boolean flag - if true, document is not listed but links still work
- `deleted`: Boolean flag - if true, document is in committee trash
- `uploadedBy`: User ID of uploader
- `uploadedAt`: Timestamp of upload
- `deletedBy`: User ID of deleter (if deleted)
- `deletedAt`: Timestamp of deletion

**Document States**:
1. **Published** (`published=true, archived=false, deleted=false`): Visible on committee page, accessible via URL
2. **Archived** (`archived=true`): Not listed on page but existing links work
3. **Deleted** (`deleted=true`): In committee trash, not publicly accessible, can be restored by committee publishers
4. **Draft** (`published=false, archived=false, deleted=false`): Uploaded but not yet published

**Storage**:
- Files stored in `/data/documents/<committee-id>/`
- Deleted files moved to `/data/documents/<committee-id>/.trash/`

**Constraints**:
- committeeId must reference valid Committee
- uploadedBy must reference valid User

---

### Event

Represents calendar events.

```prisma
model Event {
  id          String    @id @default(uuid())
  title       String
  description String?
  startAt     DateTime
  endAt       DateTime?
  createdBy   String    // User.id reference
  createdAt   DateTime  @default(now())
  updatedBy   String?   // User.id reference
  updatedAt   DateTime  @updatedAt
}
```

**Fields**:
- `id`: UUID primary key
- `title`: Event title
- `description`: Optional event description
- `startAt`: Event start date/time
- `endAt`: Optional event end date/time
- `createdBy`: User ID of creator
- `createdAt`: Timestamp of event creation
- `updatedBy`: User ID of last editor
- `updatedAt`: Timestamp of last update

**Access Rules**:
- Public: Events in current calendar month or future
- Protected: Events before current calendar month require verified login
- Management: Only users with `calendar` role can create/edit/delete

---

### AuditLog

Records all user actions and anonymous access for auditing purposes.

```prisma
model AuditLog {
  id        String   @id @default(uuid())
  userId    String?  // User.id reference or null for anonymous
  actor     String?  // "firstName lastName (Unit: X)" or "anonymous"
  unit      String?
  action    String
  target    String?  // filename / event id / api route
  meta      Json?
  createdAt DateTime @default(now())
}
```

**Fields**:
- `id`: UUID primary key
- `userId`: User ID if authenticated, null for anonymous
- `actor`: Formatted actor string (e.g., "John Doe (Unit: 123)" or "anonymous")
- `unit`: Unit number if applicable
- `action`: Action type (login, logout, upload, publish, archive, delete, restore, verify, deny, etc.)
- `target`: Target of action (document filename, event ID, API route, etc.)
- `meta`: Additional JSON metadata specific to action
- `createdAt`: Timestamp of action

**Common Actions**:
- `login`, `logout`, `login_failed`
- `upload`, `publish`, `archive`, `delete`, `restore`
- `event_create`, `event_update`, `event_delete`
- `user_verify`, `user_deny`
- `role_assign`, `role_remove`
- `committee_add_member`, `committee_remove_member`
- `profile_update`
- `page_view` (anonymous)

**Storage**:
- Logs written to `/data/logs/audit.log` (volume-mounted for backup)

**Retention**:
- Authenticated logs: 12 months (configurable)
- Anonymous logs: 90 days (configurable)

---

### SystemConfig

Stores runtime configuration values editable by dbadmin.

```prisma
model SystemConfig {
  id          String   @id @default(uuid())
  key         String   @unique
  value       String
  description String?
  updatedBy   String?  // User.id reference
  updatedAt   DateTime @updatedAt
}
```

**Fields**:
- `id`: UUID primary key
- `key`: Unique configuration key
- `value`: Configuration value (stored as string, parsed as needed)
- `description`: Optional description of configuration purpose
- `updatedBy`: User ID of last updater
- `updatedAt`: Timestamp of last update

**Standard Configuration Keys**:
- `session_timeout_days`: Session expiration in days (default: 90)
- `disk_alert_threshold_percent`: Disk usage percentage for alerts (default: 85)
- `max_upload_size_mb`: Maximum file upload size in MB (default: 25)
- `audit_log_retention_days`: Retention period for audit logs (default: 365)
- `anonymous_log_retention_days`: Retention period for anonymous logs (default: 90)
- `rate_limit_login_attempts`: Max login attempts before lockout (default: 5)
- `rate_limit_magic_link_requests`: Max magic link requests per hour (default: 3)
- `failed_login_alert_threshold`: Failed logins before dbadmin alert (default: 3)

**Access**:
- Only dbadmin role can modify SystemConfig
- Changes are logged in AuditLog

---

### EmailTemplate

Stores customizable email templates.

```prisma
model EmailTemplate {
  id        String   @id @default(uuid())
  key       String   @unique
  subject   String
  body      String   @db.Text
  variables String?  // JSON array of available template variables
  updatedBy String?  // User.id reference
  updatedAt DateTime @updatedAt
}
```

**Fields**:
- `id`: UUID primary key
- `key`: Unique template identifier
- `subject`: Email subject line (can contain variables)
- `body`: Email body text/HTML (can contain variables)
- `variables`: JSON array describing available template variables
- `updatedBy`: User ID of last updater
- `updatedAt`: Timestamp of last update

**Standard Templates**:

1. **magic-link** (Magic Link Login)
   - Variables: `{{email}}`, `{{link}}`, `{{expiresIn}}`
   - Subject: "Sign in to Indian Village Manor"

2. **verifier-notification** (New Registration Alert)
   - Variables: `{{firstName}}`, `{{lastName}}`, `{{email}}`, `{{phone}}`, `{{unit}}`, `{{isResident}}`, `{{isOwner}}`, `{{verificationLink}}`
   - Subject: "New User Registration Pending Verification"

3. **approval** (Registration Approved)
   - Variables: `{{firstName}}`, `{{lastName}}`, `{{unit}}`, `{{loginLink}}`
   - Subject: "Welcome to Indian Village Manor - Registration Approved"

4. **denial** (Registration Denied)
   - Variables: `{{firstName}}`, `{{lastName}}`, `{{reason}}`, `{{contactEmail}}`, `{{contactPhone}}`
   - Subject: "Indian Village Manor Registration - Additional Information Needed"

5. **profile-update-reverify** (Profile Update Requires Re-verification)
   - Variables: `{{firstName}}`, `{{lastName}}`, `{{changes}}`
   - Subject: "Profile Update Requires Re-verification"

6. **email-recovery-unit** (Forgot Email - Unit Reminder)
   - Variables: `{{unit}}`, `{{emails}}`
   - Subject: "Indian Village Manor - Email Reminder"

**Template Syntax**:
- Variables use `{{variableName}}` syntax
- Supports basic conditionals: `{{#if variable}}...{{/if}}`
- Supports loops: `{{#each array}}...{{/each}}`

**Access**:
- Only dbadmin role can modify EmailTemplate
- Changes are logged in AuditLog

---

## Relationships Summary

### Many-to-Many Relationships

1. **User ↔ Role**
   - Join table: `_UserRoles`
   - A user can have multiple roles
   - A role can be assigned to multiple users

2. **User ↔ Committee**
   - Join table: `_Memberships`
   - A user can be a member of multiple committees
   - A committee can have multiple members

### One-to-Many Relationships

1. **Committee → Document**
   - A committee can have many documents
   - A document belongs to one committee

### Reference Relationships

These are stored as string references to User.id for audit purposes:

- Document.uploadedBy → User.id
- Document.deletedBy → User.id
- Event.createdBy → User.id
- Event.updatedBy → User.id
- User.verificationUpdatedBy → User.id
- AuditLog.userId → User.id
- SystemConfig.updatedBy → User.id
- EmailTemplate.updatedBy → User.id

**Note**: These are stored as strings rather than foreign keys to maintain audit trail even if users are deleted.

---

## Indexes and Performance

### Recommended Indexes

```sql
-- User indexes
CREATE INDEX idx_user_verification_status ON "User"("verificationStatus");
CREATE INDEX idx_user_unit_number ON "User"("unitNumber");
CREATE INDEX idx_user_email ON "User"("email"); -- already created by @unique

-- Document indexes
CREATE INDEX idx_document_committee_id ON "Document"("committeeId");
CREATE INDEX idx_document_published ON "Document"("published");
CREATE INDEX idx_document_archived ON "Document"("archived");
CREATE INDEX idx_document_deleted ON "Document"("deleted");

-- Event indexes
CREATE INDEX idx_event_start_at ON "Event"("startAt");

-- AuditLog indexes
CREATE INDEX idx_audit_user_id ON "AuditLog"("userId");
CREATE INDEX idx_audit_action ON "AuditLog"("action");
CREATE INDEX idx_audit_created_at ON "AuditLog"("createdAt");

-- SystemConfig and EmailTemplate already indexed by @unique on key
```

### Query Optimization Notes

1. **Fetching user with roles and committees**: Use Prisma's `include` to avoid N+1 queries
2. **Document listing**: Query with composite conditions (`published=true AND deleted=false`)
3. **Event filtering by date**: Use indexes on `startAt` for calendar month queries
4. **Audit log queries**: Partition or archive old logs for performance

---

## Migrations

All database migrations are managed through Prisma Migrate. See [DATABASE_MIGRATIONS.md](./DATABASE_MIGRATIONS.md) for deployment strategy.

### Initial Migration

```bash
npx prisma migrate dev --name init
```

### Schema Changes

When modifying the schema:
1. Update `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <descriptive-name>`
3. Test rollback capability
4. Review generated SQL
5. Deploy to production using blue-green strategy (see [DATABASE_MIGRATIONS.md](./DATABASE_MIGRATIONS.md))

---

## Seed Data

Initial seed data (see `prisma/seed.ts`):

1. **Roles**: dbadmin, publisher, calendar, verifier, user, owner
2. **Bootstrap User**: "IVM Bootstrap User", verified, all roles
3. **SystemConfig defaults**: session timeout, alert thresholds
4. **EmailTemplate defaults**: All standard templates

---

## Backup and Recovery

### Backup Coverage

All data is backed up nightly:
- PostgreSQL database dump (all tables)
- Uploaded documents (`/data/documents`)
- Audit logs (`/data/logs`)

### Recovery

To restore from backup:
```bash
# Restore database
psql -U postgres -d ivm_db < backup.sql

# Restore documents
rsync -av /backup/documents/ /data/documents/

# Restore logs
rsync -av /backup/logs/ /data/logs/
```

See [OPERATIONS.md](./OPERATIONS.md) for detailed backup/recovery procedures.

---

## Security Considerations

1. **Sensitive Data**:
   - Passwords are NOT stored (magic-link authentication)
   - Email and phone are personal data - access controlled
   - Audit logs contain detailed user actions - dbadmin only

2. **Access Control**:
   - All queries should check user roles and verification status
   - Publisher actions must verify committee membership
   - Soft deletes (deleted flag) prevent accidental data loss

3. **Data Validation**:
   - Email format validation
   - Unit number: alphanumeric, max 6 chars
   - Phone number format (configurable pattern)
   - File upload validation (type, size)

4. **GDPR Considerations**:
   - Users can update their profile
   - Audit logs track all data access
   - Data retention policies configurable
   - User deletion should cascade or anonymize audit logs

---

## Future Enhancements

Potential schema additions for future versions:

1. **UserSession**: Track active sessions for forced logout
2. **Notification**: System notifications for users
3. **FileMetadata**: Additional metadata for documents (tags, categories)
4. **CommitteeRole**: Role-specific permissions within committees
5. **EventAttendee**: Track RSVP for events
6. **MaintenanceRequest**: Facility maintenance tracking
7. **PaymentRecord**: HOA payment tracking

---

## Questions or Issues

For questions about the database schema, see:
- [DESIGN.md](./DESIGN.md) for business rules
- [DATABASE_MIGRATIONS.md](./DATABASE_MIGRATIONS.md) for migration strategy
- [OPERATIONS.md](./OPERATIONS.md) for operational procedures
