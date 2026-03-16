# Indian Village Manor - Development Progress

## Overview
This document tracks the completion status of all milestones in the Indian Village Manor project implementation.

**Last Updated**: 2026-02-17

---

## Phase 1: Foundation (M0-M4)

### M00: Project Setup
**Status**: ✅ Completed
**Started**: 2026-02-17
**Completed**: 2026-02-17
**Key Deliverables**:
- [x] Next.js project with TypeScript
- [x] TailwindCSS configuration
- [x] PostgreSQL database (local + Docker)
- [x] Prisma initialization
- [x] Nodemailer configuration
- [x] Basic project structure
- [x] docker-compose.yml

---

### M01: Anonymous User Experience
**Status**: ✅ Completed
**Started**: 2026-02-17
**Completed**: 2026-02-17

**Goal**: Create a single long scrollable home page matching the reference project exactly in look, feel, and responsive behavior.

**Key Deliverables**:
- [x] Responsive grid layout system (WindowContext, WindowWithSize, 6 grid components)
- [x] Hamburger menu navigation with fixed header
- [x] Six content sections (Home, Interiors1, Amenities, Floor Plans, Interiors2, Contact)
- [x] Modal component for zooming floor plan graphics
- [x] All image assets copied from reference (18 images)
- [x] Exact styling match (IVM green theme, Noto Serif font, responsive behavior)
- [x] Stub authentication (login menu item disabled)

**Reference**: `/home/levis/Development/IVM/IndianVillageManor/ivm_app`

**Issues Resolved**:
- next-auth peer dependency conflict (resolved with --legacy-peer-deps)
- React hydration mismatch in WindowWithSize (fixed with default rendering)
- NextAuth SESSION_FETCH_ERROR (fixed with stub API route)
- Modal image 400 error (fixed with early return)
- Tailwind border-border class error (removed from CSS)

**Details**: See [M01-anonymous-user-experience.md](./M01-anonymous-user-experience.md)

---

### M02: Database Schema and Seed Data
**Status**: ✅ Completed
**Started**: 2026-02-17
**Completed**: 2026-02-17

**Goal**: Complete database schema with initial bootstrap user and seed data.

**Key Deliverables**:
- [x] Complete Prisma schema with all models (User, Role, Committee, Document, Event, AuditLog, SystemConfig, EmailTemplate)
- [x] Migration files (removed isResident/isOwner boolean fields, replaced with role-based approach)
- [x] Seed script with bootstrap user
- [x] 7 standard roles (dbadmin, publisher, calendar, verifier, user, owner, resident)
- [x] 8 SystemConfig defaults
- [x] 6 EmailTemplate defaults
- [x] Idempotent seed script (can run multiple times safely)

**Issues Resolved**:
- Schema alignment: Removed `isResident` and `isOwner` boolean fields in favor of role-based approach
- Created migration: `20260217190845_remove_is_resident_is_owner_fields`
- Seed script successfully creates bootstrap user with email: indianvillagemanor+bootstrap@gmail.com
- All database indexes properly configured for performance
- Verified idempotency of seed script (no duplicates on repeated runs)

**Details**: See [M02-database-schema-seed.md](./M02-database-schema-seed.md)

---

### M03: Magic Link Authentication and Basic Audit Logging
**Status**: ✅ Completed
**Started**: 2026-02-17
**Completed**: 2026-02-17

**Goal**: Implement email magic-link authentication flow with rate limiting and basic audit logging.

**Key Deliverables**:
- [x] NextAuth configuration with email provider
- [x] Magic-link email template (from EmailTemplate table)
- [x] Login page with email input
- [x] "Check your email" confirmation page
- [x] Auth error page for pending/denied users
- [x] Session management with secure HTTP-only cookies
- [x] Logout functionality in header menu
- [x] Email verification token generation and validation
- [x] Rate limiting for login and magic-link requests
- [x] Pending users blocked from logging in with appropriate message
- [x] Email recovery flow (unit number lookup)
- [x] Basic audit logging to /data/logs volume
- [x] Failed login attempt tracking
- [x] Session timeout configured via SystemConfig (90 days)

**Database Changes**:
- Added NextAuth tables: Account, Session, VerificationToken
- Updated User model with accounts and sessions relations
- Updated AuditLog model schema (entityType, entityId, details, ipAddress, userAgent)

**New Files Created**:
- `lib/auth.ts` - NextAuth configuration and callbacks
- `lib/audit.ts` - Audit logging utility with file and database writes
- `types/next-auth.d.ts` - TypeScript type declarations for NextAuth
- `app/auth/login/page.tsx` - Login page with email input
- `app/auth/verify-request/page.tsx` - Confirmation page after magic link sent
- `app/auth/error/page.tsx` - Error page for auth failures
- `app/auth/forgot-email/page.tsx` - Email recovery by unit number
- `app/api/auth/recover-email/route.ts` - Email recovery API endpoint

**Issues Resolved**:
- Fixed Prisma import to use named exports `{ prisma }`
- Fixed TypeScript linting errors (removed `any` types, unused parameters)
- Fixed ESLint errors (replaced `<a>` with `<Link>`, escaped entities)
- Wrapped useSearchParams in Suspense boundary for error page
- Fixed Prisma JSON type casting for audit log details

**Details**: See [M03-magic-link-auth-audit.md](./M03-magic-link-auth-audit.md)

---

### M04: Basic Menu and Navigation for Authenticated Users
**Status**: ✅ Completed
**Started**: 2026-02-17
**Completed**: 2026-02-17

**Goal**: Authenticated users see appropriate menu items based on their roles and verification status.

**Key Deliverables**:
- [x] Dynamic menu items based on authentication status
- [x] Logout functionality in hamburger menu
- [x] User info displayed when signed in
- [x] Committee links infrastructure (API endpoint for visible committees)
- [x] Role-based committee visibility rules implemented
- [x] Verified Calendar link is NOT present (will be added in M11)
- [x] Improved menu UX (full-width clickable areas, hover states, click-outside-to-close)
- [x] Session-based auto-open menu on fresh login

**New Files Created**:
- `app/api/committees/visible/route.ts` - API endpoint for fetching user's visible committees

**Files Modified**:
- `components/site_menu.tsx` - Added committee fetching and display logic, improved UX
- `components/SessionProviderWrapper.tsx` - Added SessionTracker for fresh login detection

**Committee Visibility Rules Implemented**:
- Show committees with published documents (visible to all verified users)
- Show committees where user is a member (visible even if no published docs)
- Show committees where user has publisher role (visible even if no published docs)

**Manual Test Results**:
- ✅ Bootstrap user can log in and see Logout button
- ✅ Calendar link is NOT present (will be added in M11)
- ✅ Unauthenticated users see only Login link
- ✅ Menu is responsive on mobile and desktop
- ✅ Pending users cannot log in (tested in M03)
- ✅ Click outside menu closes it
- ✅ Menu auto-opens only on fresh login, not on every page load

**Notes**:
- No committees exist yet in seed data (will be created in M09)
- Committee links section will appear empty until committees are created
- Menu UX significantly improved with full-width hit areas and hover feedback
- Semi-transparent overlay provides clear visual feedback

**Details**: See [M04-menu-navigation.md](./M04-menu-navigation.md)

---

## Phase 2: User Management (M5-M8.5)

### M05: User Registration Flow
**Status**: ✅ Completed
**Started**: 2026-02-17
**Completed**: 2026-02-17

**Goal**: New users can register with required information and receive confirmation of pending verification status.

**Key Deliverables**:
- [x] Registration form with validation (firstName, lastName, email, phone, unit, resident/owner checkboxes)
- [x] Zod schema for registration data validation
- [x] Required fields validation enforced
- [x] Unit number validation (alphanumeric, max 6 characters)
- [x] At least one role (resident/owner) required
- [x] Create user with verificationStatus = "pending"
- [x] Registration confirmation page with clear messaging
- [x] Form validation and error handling
- [x] Duplicate email detection
- [x] Register link added to site menu for unauthenticated users
- [x] Register link added to login page

**New Files Created**:
- `lib/validation.ts` - Zod validation schema for registration
- `app/register/page.tsx` - Registration form
- `app/register/confirmation/page.tsx` - Registration confirmation page
- `app/api/auth/register/route.ts` - Registration API endpoint

**Files Modified**:
- `components/site_menu.tsx` - Added Register link for unauthenticated users
- `app/auth/login/page.tsx` - Added "Create an account" link

**Technical Notes**:
- Uses role-based system (resident/owner roles) instead of boolean fields (isResident/isOwner)
- Unit numbers are normalized to uppercase during registration
- Roles are assigned via many-to-many relationship with Role table
- Zod safeParse used for validation with detailed error messages
- All validation errors properly displayed to users

**Manual Test Results**:
- ✅ Registration form accessible at /register
- ✅ All required fields validated (firstName, lastName, email, phone, unit)
- ✅ At least one of resident/owner checkbox required
- ✅ Unit number validation works (alphanumeric, max 6 chars)
- ✅ Duplicate email detection works
- ✅ Users created with pending verification status
- ✅ Roles (resident, owner, or both) properly assigned
- ✅ Confirmation page displays appropriate message
- ✅ Pending users cannot log in (enforced by M03)

**Issues Resolved**:
- Fixed Zod validation error handling by using safeParse instead of parse
- Corrected Zod error property (issues instead of errors)
- Added zod package to dependencies

**Details**: See [M05-user-registration.md](./M05-user-registration.md)

---

### M06: Verifier Notification System
**Status**: ✅ Completed
**Started**: 2026-02-17
**Completed**: 2026-02-17
**Key Deliverables**:
- [x] `lib/notifications.ts` with `sendVerifierNotification` function
- [x] Email notification to all verified users with verifier role on new registration
- [x] Email uses `verifier-notification` template from EmailTemplate table
- [x] Notification includes: firstName, lastName, email, phone, unit, resident/owner status, verification link
- [x] Verification link points to `/admin/verify` (to be implemented in M07)
- [x] Failed email notification sent to all dbadmin users
- [x] All notification actions logged to AuditLog
- [x] Notification is non-blocking (registration succeeds even if email fails)

**New Files Created**:
- `lib/notifications.ts` - `sendVerifierNotification` and `notifyDbAdminOfEmailFailure` functions

**Files Modified**:
- `app/api/auth/register/route.ts` - Added `sendVerifierNotification` call after user creation; fixed pre-existing missing `success` field in `logAuditEvent` call

**Technical Notes**:
- Notification is fire-and-forget (non-blocking) so registration API response is not delayed by email sending
- Only `verified` users with `verifier` role receive notifications (not pending/denied verifiers)
- isResident/isOwner status derived from user's roles array (matches role-based schema)
- dbadmin fallback alert uses inline email body (no template required for this edge case)

**Issues Resolved**:
- Pre-existing TypeScript error in `register/route.ts`: `logAuditEvent` call was missing required `success: boolean` field (fixed as part of this milestone)

---

### M07: Verifier Approval/Denial Flow
**Status**: ✅ Completed
**Started**: 2026-02-17
**Completed**: 2026-02-17

**Goal**: Verifiers can approve or deny pending user registrations.

**Key Deliverables**:
- [x] Verifier dashboard at `/admin/verify` listing pending registrations
- [x] Approval workflow with status update to "verified"
- [x] Denial workflow with status update to "denied"
- [x] Approval email sent using EmailTemplate "approval"
- [x] Denial email sent using EmailTemplate "denial" with reason and contact info
- [x] Verification metadata recorded (verificationUpdatedAt, verificationUpdatedBy, verificationComment)
- [x] Approved users assigned "user" role automatically
- [x] Audit log entries for both approve and deny actions
- [x] Non-verifiers blocked from API and dashboard (401/403)
- [x] "Verify Users" menu item shown only to verifier role users

**New Files Created**:
- `app/admin/verify/page.tsx` - Verifier dashboard with pending user cards, comment fields, approve/deny buttons
- `app/api/admin/verify/route.ts` - GET (list pending users) and POST (approve/deny) API endpoint

**Files Modified**:
- `components/site_menu.tsx` - Added "Verify Users" link for verifier role users

**Technical Notes**:
- Dashboard uses inline styles consistent with project patterns
- User cards display name, email, phone, unit, resident/owner badges, and registration date
- Comment field is optional but recommended for verification decisions
- Already-verified/denied users cannot be re-processed (400 error)
- Email sending is non-blocking; verification succeeds even if email fails

---

### M08: Verified User Access
**Status**: ✅ Completed
**Started**: 2026-02-17
**Completed**: 2026-02-17

**Goal**: Verified users can access protected areas of the site.

**Key Deliverables**:
- [x] Middleware to check authentication for protected routes (/dashboard, /profile, /events, /admin)
- [x] Unauthenticated users redirected to login with callbackUrl
- [x] Events page with past event date filtering (calendar month boundary)
- [x] Events API: verified users see all events; anonymous/unverified see only current month onward
- [x] User dashboard page showing account status, roles, and navigation cards
- [x] Pending users see warning about limited access on dashboard
- [x] Pending/denied users blocked at login (M03, unchanged)
- [x] Dashboard, Events, and My Profile links added to site menu for authenticated users

**New Files Created**:
- `app/dashboard/page.tsx` - User dashboard with status card and navigation
- `app/events/page.tsx` - Events listing with past event filtering
- `app/api/events/route.ts` - Events API with verification-aware filtering

**Files Modified**:
- `middleware.ts` - Updated with JWT-based auth checks for protected routes
- `components/site_menu.tsx` - Added Dashboard, Events, and My Profile links

**Technical Notes**:
- Middleware uses `next-auth/jwt` `getToken()` for Edge Runtime compatibility
- Past event boundary: events before start of current calendar month require verified login
- No separate middleware for verifier routes; role check is in the API/page component level
- Events page is accessible to all but content is filtered by verification status

---

### M08.5: User Profile Management
**Status**: ✅ Completed
**Started**: 2026-02-17
**Completed**: 2026-02-17

**Goal**: Verified users can update their profile information with re-verification flow.

**Key Deliverables**:
- [x] Profile page showing all user details (firstName, lastName, email, phone, unitNumber, resident/owner)
- [x] Profile edit form with inline editing toggle
- [x] Validation on profile update (required fields, max lengths, at least one role)
- [x] Re-verification flow: changes to firstName, lastName, phone, unitNumber, or resident/owner revert status to "pending"
- [x] Confirmation dialog before saving changes that trigger re-verification
- [x] Cancel option to discard changes and maintain verified status
- [x] Profile-update-reverify email sent to user when re-verification triggered
- [x] Verifier notification sent when profile update requires re-verification
- [x] Audit log for profile updates (records changes and whether re-verification triggered)
- [x] Email field is read-only (cannot be changed through profile edit)
- [x] Account status badge displayed on profile page

**New Files Created**:
- `app/profile/page.tsx` - Profile view/edit page with re-verification confirmation dialog
- `app/api/profile/route.ts` - GET (fetch profile) and PUT (update profile) API endpoint

**Technical Notes**:
- Email change is intentionally disabled per admin-only policy; email field shown as read-only with explanatory note
- The M08.5 milestone doc mentions email confirmation flow, but since email is tied to authentication (magic link), changing it would be complex and disruptive - deferred to a future milestone or admin operation
- Role changes (resident/owner) also trigger re-verification since they affect community membership
- Profile link was already added to site menu in M08

---

## Phase 3: Core Features (M9-M12)

### M09: Committee System
**Status**: ✅ Completed
**Started**: 2026-02-17
**Completed**: 2026-02-17

**Key Deliverables**:
- [x] Committee CRUD operations (create, read, update, delete via dbadmin)
- [x] Committee list page at /committees (dbadmin sees all; others see accessible committees)
- [x] Committee detail page at /committees/[id] with published documents
- [x] Committee admin pages at /admin/committees/[id] (create/edit/delete/manage members)
- [x] Many-to-many membership management (add/remove members, dbadmin only)
- [x] Committee permissions (dbadmin CRUD; verified users read-only for accessible committees)
- [x] API routes: /api/admin/committees, /api/admin/committees/[id], /api/admin/committees/[id]/members, /api/committees/[id]
- [x] Updated /api/committees/visible to include member/document counts and dbadmin shortcut
- [x] Updated /api/admin/users route for user-picker in membership management
- [x] "Committees" and "Admin Console" links added to site menu for dbadmin users
- [x] Middleware updated to protect /committees and /admin/committees routes
- [x] Audit logging for all committee and membership operations

**New Files Created**:
- `app/api/admin/committees/route.ts` - List/create committees (dbadmin)
- `app/api/admin/committees/[id]/route.ts` - Get/update/delete a committee (dbadmin)
- `app/api/admin/committees/[id]/members/route.ts` - Add/remove committee members (dbadmin)
- `app/api/committees/[id]/route.ts` - Public committee detail (visibility-checked)
- `app/api/admin/users/route.ts` - List verified users for member-add dropdown (dbadmin)
- `app/committees/page.tsx` - Committee list page
- `app/committees/[id]/page.tsx` - Committee detail page
- `app/admin/committees/[id]/page.tsx` - Committee create/edit/manage-members page

**Files Modified**:
- `app/api/committees/visible/route.ts` - Added dbadmin shortcut, member/doc counts, deleted filter
- `components/site_menu.tsx` - Added Committees and Admin Console links for dbadmin
- `middleware.ts` - Added /committees and /admin/committees route protection

**Notes**:
- Delete is blocked if the committee has any documents (must remove documents first)
- Committee detail page shows member list only to dbadmin and committee members
- Published documents are shown to all verified users who can see the committee

---

### M10: Document Publishing System
**Status**: ✅ Completed
**Started**: 2026-02-17
**Completed**: 2026-02-17

**Key Deliverables**:
- [x] Document upload API with MIME type + file extension + size validation
- [x] Filename sanitization (spaces to underscores, UUID prefix for collision prevention)
- [x] Publisher interface at /committees/[id]/documents (publisher + committee member or dbadmin)
- [x] Publish/archive/delete workflow via PATCH and DELETE endpoints
- [x] Restore functionality (restore deleted → archived state)
- [x] Permanent delete from trash
- [x] Committee trash section in publisher UI
- [x] Document download API with path traversal protection and access control
- [x] Auto-create /data/documents/<committeeId> and .trash directories on demand
- [x] "Manage Documents" button on committee detail page for authorized publishers
- [x] "Download" links on published documents for verified users
- [x] Audit logging for all document actions (upload, publish, archive, delete, restore, permanent delete)

**New Files Created**:
- `app/api/committees/[id]/documents/route.ts` - Upload and list documents
- `app/api/documents/[id]/route.ts` - PATCH (publish/archive) and DELETE (soft delete)
- `app/api/documents/[id]/restore/route.ts` - Restore deleted document
- `app/api/documents/[id]/permanent/route.ts` - Permanently delete from trash
- `app/api/documents/[id]/download/route.ts` - Serve document file
- `app/committees/[id]/documents/page.tsx` - Publisher document management UI

**Files Modified**:
- `app/committees/[id]/page.tsx` - Added "Manage Documents" button and download links

**Technical Notes**:
- Files stored at `/data/documents/<committeeId>/<uuid>_<sanitized-name>.<ext>`
- Deleted files moved to `/data/documents/<committeeId>/.trash/<filename>`
- Download endpoint validates path cannot escape /data/documents (no path traversal)
- Missing file on disk is handled gracefully (logs warning, does not fail request)
- max_upload_size_mb read from SystemConfig (default 25 MB)

---

### M11: Event Calendar System
**Status**: ✅ Completed
**Started**: 2026-02-17
**Completed**: 2026-02-17

**Key Deliverables**:
- [x] Event CRUD operations via API (POST/PUT/DELETE requiring calendar or dbadmin role)
- [x] Event management pages: /events/new (create) and /events/[id]/edit (edit)
- [x] Calendar view at /events with month divider groupings
- [x] Past events visually indicated (reduced opacity + "Past" badge)
- [x] Inline delete confirmation modal (no browser alert)
- [x] Date-based filtering: public sees current month+; verified users see all events
- [x] Calendar link in hamburger menu for all verified users (renamed "Events" → "Calendar")
- [x] Access denied message for non-calendar users visiting manage pages
- [x] Login callout for anonymous users explaining past events require login
- [x] Audit log for event_created, event_updated, event_deleted

**New Files Created**:
- `app/api/events/[id]/route.ts` - GET/PUT/DELETE single event
- `app/events/new/page.tsx` - Create event form (calendar/dbadmin)
- `app/events/[id]/edit/page.tsx` - Edit event form (calendar/dbadmin)

**Files Modified**:
- `app/api/events/route.ts` - Added POST handler; changed GET ordering to asc
- `app/events/page.tsx` - Full rewrite with month groups, badges, edit/delete, callout
- `components/site_menu.tsx` - Renamed "Events" label to "Calendar"

**Technical Notes**:
- Next.js 15 async params pattern used in edit page (`params.then()`)
- Middleware already covered /events:path* so no changes needed there
- endAt validation: if provided, must be after startAt

---

### M12: Database Admin Console
**Status**: ✅ Completed
**Started**: 2026-02-17
**Completed**: 2026-02-17

**Key Deliverables**:
- [x] Admin console main dashboard at /admin/console with navigation cards
- [x] User list page with search, status filter, role/verification badges
- [x] User edit page with profile, role assignment, committee membership
- [x] Bulk operations: assign role and add to committee for multiple users
- [x] SystemConfig management UI with inline editing and numeric validation
- [x] EmailTemplate management UI with accordion editor, variable chips, character count
- [x] API routes for user CRUD, bulk ops, config, and template management
- [x] Audit logging for all admin actions (profile, roles, committees, config, templates, bulk)
- [x] Only dbadmin can access admin console (middleware + page-level checks)
- [x] "Admin Console" link already added in site menu (M09)

**New Files Created**:
- `app/admin/console/page.tsx` - Admin console dashboard
- `app/admin/console/users/page.tsx` - User list with bulk operations
- `app/admin/console/users/[id]/page.tsx` - User edit page
- `app/admin/console/config/page.tsx` - SystemConfig editor
- `app/admin/console/templates/page.tsx` - EmailTemplate accordion editor
- `app/api/admin/users/[id]/route.ts` - GET/PUT single user
- `app/api/admin/users/bulk/route.ts` - Bulk role/committee assignment
- `app/api/admin/config/route.ts` - GET/PUT system config
- `app/api/admin/templates/route.ts` - GET email templates list
- `app/api/admin/templates/[id]/route.ts` - GET/PUT single email template

**Files Modified**:
- `app/api/admin/users/route.ts` - Added ?all=true param for full user list
- `middleware.ts` - Added /admin/console to ADMIN_ROUTES

**Technical Notes**:
- Numeric SystemConfig keys validated as positive integers
- Bulk operations skip already-assigned roles/committees, per-user audit log entries
- Email template variables parsed from JSON `variables` field and shown as chips
- User role/committee updates are set-replace (not additive) via disconnect/connect

---

## Phase 4: Production Ready (M13-M20)

### M13: Comprehensive Audit Logging System
**Status**: ✅ Completed
**Started**: 2026-02-17
**Completed**: 2026-02-17

**Key Deliverables**:
- [x] Enhanced audit logging with actor formatting ("firstName lastName (Unit: X)" or "anonymous")
- [x] Consolidated JSON-lines audit.log file in /data/logs volume
- [x] Robot/bot detection via user-agent pattern matching (30+ bot patterns)
- [x] Bot traffic filtered from anonymous page view logs
- [x] Log retention cleanup function with configurable retention periods
- [x] Audit log viewer UI at /admin/console/audit-logs (dbadmin only)
- [x] Search/filter by user, action type, date range
- [x] Export to CSV functionality
- [x] View log details (expandable JSON details)
- [x] Pagination support (50 entries per page)
- [x] Log retention cleanup via UI with confirmation dialog
- [x] Audit Logs card added to Admin Console dashboard
- [x] Query helper function with filtering support

**New Files Created**:
- `app/api/admin/audit-logs/route.ts` - GET (query/filter/export) and POST (cleanup) API
- `app/admin/console/audit-logs/page.tsx` - Audit log viewer with search, filter, export, cleanup

**Files Modified**:
- `lib/audit.ts` - Enhanced with bot detection, actor formatting, JSON-lines log format, cleanup/query functions
- `app/admin/console/page.tsx` - Added Audit Logs navigation card

**Technical Notes**:
- Log format changed from pipe-delimited to JSON-lines for better parseability
- Bot detection uses regex patterns for 30+ known bot user-agents
- Anonymous page views from bots are silently dropped (not logged)
- Retention policies read from SystemConfig: audit_log_retention_days (365), anonymous_log_retention_days (90)
- CSV export limited to 10,000 entries per export

---

### M14: SSO Authentication
**Status**: ✅ Completed
**Started**: 2026-02-17
**Completed**: 2026-02-17

**Key Deliverables**:
- [x] Google OAuth provider (conditional on GOOGLE_CLIENT_ID/SECRET env vars)
- [x] Microsoft / Azure AD OAuth provider (conditional on AZURE_AD_CLIENT_ID/SECRET env vars)
- [x] Dynamic provider loading - SSO buttons only appear if credentials are configured
- [x] Login page updated with SSO buttons (Google icon, Microsoft icon) and "or continue with email" divider
- [x] SSO account linking to existing users by email (allowDangerousEmailAccountLinking)
- [x] Unregistered SSO users redirected to error page with "Registration Required" message
- [x] Auth error page updated with SSONotRegistered error handling
- [x] .env.example updated with SSO configuration variables
- [x] Provider info API endpoint (/api/auth/providers-info) for client-side provider discovery
- [x] Magic link still works alongside SSO (always available)
- [x] Audit logging includes provider name for SSO logins

**New Files Created**:
- `app/api/auth/providers-info/route.ts` - Returns list of configured SSO providers

**Files Modified**:
- `lib/auth.ts` - Added Google and Azure AD providers with dynamic loading
- `app/auth/login/page.tsx` - SSO buttons with provider icons, divider
- `app/auth/error/page.tsx` - Added SSONotRegistered error case
- `.env.example` - Added SSO environment variables

**Technical Notes**:
- SSO is fully optional - when no OAuth env vars are set, login page shows only magic link (no visual change)
- Uses `allowDangerousEmailAccountLinking: true` so SSO accounts auto-link to existing users by email
- Users must register first before SSO sign-in will work (unregistered SSO users see error page)
- Azure AD uses `tenantId: 'common'` by default for any Microsoft account

---

### M15: Containerization and Deployment
**Status**: ✅ Completed
**Started**: 2026-02-17
**Completed**: 2026-02-17

**Key Deliverables**:
- [x] Multi-stage Dockerfile (deps, builder, runner) with standalone output
- [x] Production docker-compose.prod.yml with app, postgres, and nginx containers
- [x] Nginx reverse proxy with security headers
- [x] Persistent volumes: postgres_data, documents_data (/data/documents), logs_data (/data/logs)
- [x] Docker entrypoint script runs Prisma migrations on startup
- [x] Health checks on all three containers
- [x] Health check API endpoint at /api/health
- [x] .dockerignore for optimized builds
- [x] next.config.ts updated with output: "standalone"
- [x] Environment variables configurable via docker-compose

**New Files Created**:
- `Dockerfile` - Multi-stage production build
- `docker-compose.prod.yml` - Full production stack
- `docker-entrypoint.sh` - Entrypoint with Prisma migrate deploy
- `.dockerignore` - Build exclusion list
- `nginx/default.conf` - Nginx reverse proxy config
- `app/api/health/route.ts` - Health check endpoint

**Files Modified**:
- `next.config.ts` - Added output: "standalone"

**Technical Notes**:
- Development docker-compose.yml unchanged for local dev
- App runs as non-root user (nextjs:nodejs, UID 1001)
- Nginx handles client_max_body_size 50M for uploads

---

### M16: Backup and Recovery
**Status**: ✅ Completed
**Started**: 2026-02-17
**Completed**: 2026-02-17

**Key Deliverables**:
- [x] Backup script (scripts/backup/backup.sh) for database, documents, and logs
- [x] Restore script (scripts/backup/restore.sh) with interactive confirmation
- [x] Optional AES-256-CBC encryption via BACKUP_ENCRYPTION_KEY
- [x] Configurable backup retention with automatic cleanup (default 30 days)
- [x] Crontab example for scheduled daily backups at 2:00 AM
- [x] [DATABASE_MIGRATIONS.md](../DATABASE_MIGRATIONS.md) already comprehensive (created earlier)
- [x] PostgreSQL custom-format dump for efficient restore
- [x] Combined archive creation (database + documents + logs)

**New Files Created**:
- `scripts/backup/backup.sh` - Full backup script with encryption
- `scripts/backup/restore.sh` - Interactive restore script with decryption
- `scripts/backup/crontab.example` - Cron schedule for automated backups

**Technical Notes**:
- Backup format: tar.gz (or tar.gz.enc when encrypted)
- Database: pg_dump custom format (--format=custom) for selective restore
- Documents and logs compressed separately before combining
- Restore script prompts before overwriting database
- Old backups older than retention period auto-deleted
- [DATABASE_MIGRATIONS.md](../DATABASE_MIGRATIONS.md) already covers migration rollback testing

---

### M17: Security Hardening
**Status**: ✅ Completed
**Started**: 2026-02-17
**Completed**: 2026-02-17

**Key Deliverables**:
- [x] Security headers in middleware: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy, Content-Security-Policy, Strict-Transport-Security
- [x] Security headers applied to ALL responses (matcher broadened to catch all non-static routes)
- [x] Input sanitization library (lib/sanitize.ts): HTML escaping, string sanitization, filename sanitization, email sanitization
- [x] SQL injection pattern detection (defense-in-depth logging, Prisma already prevents injection)
- [x] File upload security already implemented in M10 (MIME type + extension + size validation, path traversal protection)
- [x] Rate limiting already implemented in M03 (login attempts, magic link requests)
- [x] CSRF protection via NextAuth (JWT strategy with HTTP-only cookies)
- [x] XSS prevention via React (auto-escaping) + CSP header + sanitize utility
- [x] SQL injection prevention via Prisma parameterized queries
- [x] Secure session configuration via JWT HTTP-only cookies (M03)
- [x] Dependency vulnerability scan: 9 moderate issues in eslint dev dependencies (no production vulnerabilities)

**New Files Created**:
- `lib/sanitize.ts` - Input sanitization utilities (escapeHtml, sanitizeString, sanitizeFilename, sanitizeEmail, hasSqlInjectionPatterns)

**Files Modified**:
- `middleware.ts` - Added security headers to all responses, broadened matcher to cover all routes

**Technical Notes**:
- CSP allows 'unsafe-inline' and 'unsafe-eval' for Next.js SSR compatibility
- Nginx also adds security headers (nginx/default.conf) for defense-in-depth
- npm audit shows 9 moderate vulnerabilities in eslint dev dependencies only; no production vulnerabilities
- Prisma handles SQL injection prevention at the ORM level; sanitize.ts provides defense-in-depth detection

---

### M18: Testing Infrastructure and Coverage
**Status**: ✅ Completed
**Started**: 2026-02-17
**Completed**: 2026-02-17

**Key Deliverables**:
- [x] Jest configuration for unit/integration tests (ts-jest preset, @/ path mapping)
- [x] Playwright configuration for E2E tests (Chromium, 30s timeout, html+list reporters)
- [x] Unit tests for utility libraries: sanitize.ts (14 tests), audit.ts (10 tests), validation.ts (11 tests + various phone formats)
- [x] E2E test suite: public page loading, security headers verification, protected route redirects
- [x] Test coverage reporting with Istanbul (60% threshold for global coverage)
- [x] npm test scripts: test, test:watch, test:coverage, test:e2e, test:e2e:ui, test:all, typecheck
- [x] All 46 unit tests passing
- [x] TypeScript type-checking clean (npx tsc --noEmit)
- [x] Fixed hasSqlInjectionPatterns regex to avoid false positives on natural language text

**New Files Created**:
- `jest.config.ts` - Jest configuration with ts-jest, path mapping, coverage thresholds
- `playwright.config.ts` - Playwright config (Chromium, single worker, retry once)
- `__tests__/lib/sanitize.test.ts` - Unit tests for escapeHtml, sanitizeString, sanitizeFilename, sanitizeEmail, hasSqlInjectionPatterns
- `__tests__/lib/audit.test.ts` - Unit tests for isBot (bot detection) and formatActor (actor display formatting)
- `__tests__/lib/validation.test.ts` - Unit tests for registrationSchema Zod validation
- `e2e/basic.spec.ts` - E2E tests for public pages, security headers, and auth redirects

**Files Modified**:
- `package.json` - Added test scripts and dev dependencies (jest, ts-jest, @types/jest, playwright, @playwright/test)
- `lib/sanitize.ts` - Fixed hasSqlInjectionPatterns regex patterns (SELECT * FROM, column lists, UNION SELECT, INSERT INTO instead of overly broad keyword matching)

**Technical Notes**:
- Jest uses --forceExit flag due to setInterval in audit.ts rate limiting (non-blocking)
- E2E tests require a running dev server (localhost:3000) to execute
- Coverage thresholds set at 60% globally (branches, functions, lines, statements)
- hasSqlInjectionPatterns refactored to detect specific SQL patterns (SELECT * FROM, SELECT col,, UNION SELECT, DROP TABLE, INSERT INTO, OR 1=1) without false positives on natural English text like "please select the document from the list"

---

### M19: Documentation and Operations Guide
**Status**: ✅ Completed
**Started**: 2026-02-17
**Completed**: 2026-02-17

**Key Deliverables**:
- [x] README.md rewritten with comprehensive project overview, setup instructions, project structure, scripts, environment variables
- [x] [DEPLOYMENT.md](../DEPLOYMENT.md) - Docker-based production deployment guide (architecture, SSL, updating, rollback, troubleshooting)
- [x] [OPERATIONS.md](../OPERATIONS.md) - Day-to-day operations (backup/recovery, user admin, system config, audit logs, monitoring, maintenance)
- [x] [API.md](../API.md) - Complete REST API reference (26 endpoints, request/response formats, auth requirements)
- [x] [DATABASE.md](../DATABASE.md) (already complete from earlier milestones)
- [x] [DATABASE_MIGRATIONS.md](../DATABASE_MIGRATIONS.md) (already complete from earlier milestones)

**New Files Created**:
- `docs/DEPLOYMENT.md` - Production deployment guide
- `docs/OPERATIONS.md` - Operations and maintenance guide
- `docs/API.md` - REST API reference documentation

**Files Modified**:
- `README.md` - Complete rewrite with features, setup, structure, scripts, env vars, and documentation links

**Technical Notes**:
- All documentation references actual project configuration (docker-compose.prod.yml, nginx config, backup scripts)
- [API.md](../API.md) covers all 26 API route files with request/response examples
- [OPERATIONS.md](../OPERATIONS.md) includes SQL queries for common admin tasks
- [DEPLOYMENT.md](../DEPLOYMENT.md) covers SSL setup, container management, rollback procedures

---

### M20: Performance Optimization and Monitoring
**Status**: ✅ Completed
**Started**: 2026-02-17
**Completed**: 2026-02-17

**Key Deliverables**:
- [x] Monitoring library (lib/monitoring.ts) with system metrics collection
- [x] Alert system: failed login threshold, pending verification threshold
- [x] Email alerts to dbadmin users when thresholds exceeded
- [x] Monitoring API endpoint (/api/admin/monitoring) - GET metrics, POST check alerts
- [x] Monitoring dashboard page at /admin/console/monitoring with real-time metrics
- [x] Metrics: user stats, failed logins, audit events, document count, disk usage, memory, load, uptime
- [x] Auto-refresh every 60 seconds on monitoring dashboard
- [x] "Run Alert Checks" button for manual alert triggering
- [x] Enhanced health check endpoint with memory usage, load average, uptime
- [x] SystemConfig: pending_verification_alert_count (default: 5)
- [x] Monitoring card added to Admin Console dashboard
- [x] Alert results displayed in-page (success/warning)

**New Files Created**:
- `lib/monitoring.ts` - Metrics collection, alert checking, admin notification
- `app/api/admin/monitoring/route.ts` - GET (metrics) and POST (check alerts) API
- `app/admin/console/monitoring/page.tsx` - Monitoring dashboard with metric cards

**Files Modified**:
- `app/admin/console/page.tsx` - Added Monitoring card to console sections
- `app/api/health/route.ts` - Enhanced with memory usage, load average, uptime, version
- `prisma/seed.ts` - Added pending_verification_alert_count config

**Technical Notes**:
- Metrics are collected on-demand (no background worker) for simplicity
- Disk usage calculated recursively for /data/documents and /data/logs
- Alert checks use configured thresholds from SystemConfig
- Health check remains lightweight (no auth required) while monitoring requires dbadmin
- System metrics (os.loadavg, os.totalmem, os.freemem, os.uptime) used for server health

---

## Summary Statistics

**Total Milestones**: 21 (M00-M20)
**Completed**: 21 (M00, M01, M02, M03, M04, M05, M06, M07, M08, M08.5, M09, M10, M11, M12, M13, M14, M15, M16, M17, M18, M19, M20)
**In Progress**: 0
**Not Started**: 0
**Overall Progress**: 100%

---

## Current Phase
**All Phases Complete** - All 21 milestones (M00-M20) across 4 phases have been implemented.

## Completion Notes
- Phase 1 (Foundation): M00-M04 - Project setup, anonymous UX, database, auth, navigation
- Phase 2 (User Management): M05-M08.5 - Registration, verification, access control, profiles
- Phase 3 (Core Features): M09-M12 - Committees, documents, calendar, admin console
- Phase 4 (Production Ready): M13-M20 - Audit logging, SSO, Docker, backup, security, testing, docs, monitoring

---

## Status Legend
- ⬜ Not Started
- 🔄 In Progress
- ✅ Completed
- ⚠️ Blocked
- 🔍 Under Review
