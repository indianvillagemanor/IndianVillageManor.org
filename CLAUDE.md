# CLAUDE.md - Agent Navigation Guide

This document helps AI agents quickly understand and navigate the Indian Village Manor (IVM) project.

## Project Overview

**Indian Village Manor Community Website** - A Next.js-based HOA community website with role-based access control, document management, event calendar, and user verification workflows.

**Project Type**: Private HOA community portal
**Current Status**: All 21 milestones complete (M00-M20, 100%)
**Current Branch**: `main`
**Bootstrap User Email**: `indianvillagemanor+bootstrap@gmail.com`

## Quick Reference

### Essential Files
- `README.md` - Setup instructions and basic project info
- `docs/DESIGN.md` - Complete design specification
- `docs/DATABASE.md` - Comprehensive database schema documentation
- `docs/planning/PROGRESS.md` - Current milestone status and next steps
- `docs/planning/00-overview.md` - All milestone descriptions
- `prisma/schema.prisma` - Database schema (User, Role, Committee, Document, Event, AuditLog, SystemConfig, EmailTemplate)

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (via Docker) + Prisma ORM
- **Styling**: TailwindCSS
- **Email**: Nodemailer
- **Authentication**: NextAuth (magic link + Google + Microsoft/Azure AD SSO)

### Project Structure
```
/home/levis/Development/IVM/
├── app/                    # Next.js App Router pages
│   ├── globals.css        # TailwindCSS styles (IVM green theme)
│   ├── layout.tsx         # Root layout with WindowContext
│   ├── page.tsx           # Home page (long scroll, 6 sections)
│   ├── auth/
│   │   ├── login/page.tsx          # Magic link login form
│   │   ├── verify-request/page.tsx # "Check your email" confirmation
│   │   ├── error/page.tsx          # Auth error (pending/denied users)
│   │   └── forgot-email/page.tsx   # Email recovery by unit number
│   └── register/
│       ├── page.tsx                # Registration form
│       └── confirmation/page.tsx   # Registration confirmation
├── components/            # React components
│   ├── Logo.tsx          # IVM logo component
│   ├── Modal.tsx         # Zoom modal for images
│   ├── HeaderSection.tsx # Fixed header with hamburger menu
│   ├── site_menu.tsx     # Role-based navigation menu
│   ├── SessionProviderWrapper.tsx  # Session + fresh-login tracker
│   └── window/           # Grid system components
├── lib/                   # Utilities
│   ├── prisma.ts         # Prisma client singleton
│   ├── email.ts          # Nodemailer setup
│   ├── auth.ts           # NextAuth configuration and callbacks
│   ├── audit.ts          # Audit logging utility
│   └── validation.ts     # Zod validation schemas (registration)
├── app/api/
│   ├── auth/
│   │   ├── [...nextauth]/route.ts  # NextAuth handler
│   │   ├── recover-email/route.ts  # Email recovery endpoint
│   │   └── register/route.ts       # User registration endpoint
│   └── committees/
│       └── visible/route.ts         # Visible committees for user
├── types/
│   └── next-auth.d.ts    # TypeScript declarations for NextAuth
├── prisma/               # Database
│   ├── schema.prisma     # Schema (8 models + NextAuth tables)
│   ├── seed.ts           # Idempotent seed script
│   └── migrations/       # Migration history
├── docs/planning/        # Milestone documentation (M00-M20)
├── scripts/              # Dev utility scripts
│   └── kill3000_and_start_dev.sh  # Kill port 3000 and start dev server
└── public/images/        # Image assets (18 images from reference)
```

## Development Workflow

### Starting Development
```bash
docker-compose up -d           # Start PostgreSQL
npm install                    # Install dependencies
npx prisma migrate dev         # Run migrations
npx prisma db seed             # Seed database (idempotent)
npx prisma generate            # Generate Prisma client
/home/levis/Development/IVM/scripts/kill3000_and_start_dev.sh  # Start/restart dev server (localhost:3000)
```

### Database Management
```bash
npx prisma studio              # View data in browser
npx prisma migrate dev --name <name>  # Create new migration
npx prisma db seed             # Re-run seed (safe, idempotent)
```

### Git Workflow
- Main/default branch: `main`
- Milestone feature branches are historical at this point; current work is maintenance and iterative improvements
- Git auto-approve is enabled in VSCode settings

## Milestone System

The project follows a **21-milestone** implementation plan (M00-M20) across 4 phases:

### Phase 1: Foundation (M00-M04)
- **M00**: Project Setup ✅
- **M01**: Anonymous User Experience ✅
- **M02**: Database Schema and Seed Data ✅
- **M03**: Magic Link Authentication ✅
- **M04**: Menu and Navigation ✅

### Phase 2: User Management (M05-M08.5)
- **M05**: User Registration Flow ✅
- **M06**: Verifier Notification System ✅
- **M07**: Verifier Approval/Denial Flow ✅
- **M08**: Verified User Access ✅
- **M08.5**: User Profile Management ✅

### Phase 3: Core Features (M09-M12)
Committees, documents, calendar, admin console ✅

### Phase 4: Production Ready (M13-M20)
Audit logging, SSO, containerization, security, testing, monitoring ✅

### Current Phase
- Implementation complete across all phases
- Current work is documentation accuracy, operational hardening, and incremental improvements

**See**: `docs/planning/PROGRESS.md` for complete status and `docs/planning/00-overview.md` for all milestones.

## Database Schema Overview

### Core Models
1. **User** - firstName, lastName, email, phone, unitNumber, verificationStatus (pending/verified/denied)
2. **Role** - name (dbadmin, publisher, calendar, verifier, user, owner, resident)
3. **Committee** - name, description, members (many-to-many with User)
4. **Document** - committeeId, title, description, file path, status (draft/published/archived/deleted)
5. **Event** - title, description, start/end times, location
6. **AuditLog** - Tracks all important actions (userId, action, entityType, entityId, details, ipAddress, userAgent)
7. **SystemConfig** - Key-value config (site title, email settings, rate limits, etc.)
8. **EmailTemplate** - Reusable email templates (magic link, verification, approval, denial, etc.)

**Important**: Users have roles via many-to-many relationship. No `isResident` or `isOwner` boolean fields (removed in migration `20260217190845`).

## Key Design Patterns

### Role-Based Access Control
- 7 standard roles seeded automatically
- Many-to-many User-Role relationship
- Check role membership in middleware/API routes

### Verification Workflow
1. User registers (status: "pending")
2. Verifier receives notification
3. Verifier approves/denies user
4. User status updates to "verified" or "denied"
5. Email sent to user with outcome

### Document Lifecycle
- States: draft → published → archived → deleted
- Deleted documents go to "committee trash" (restorable)
- Uses soft delete pattern

### Audit Logging
- Log all sensitive operations
- Track: userId, action, entityType, entityId, metadata JSON
- Include ipAddress and userAgent for security
- Stored in volume-backed logs at /data/logs (implemented in M13)

## Reference Project

The UI design is based on an existing Angular project:
- **Location**: `/home/levis/Development/IVM/IndianVillageManor/ivm_app` (symlinked as `./IndianVillageManor`)
- **Goal**: Match look, feel, and responsive behavior exactly
- **Current Status**: M01 completed with exact visual match

## Common Tasks for Agents

### Reading Project Status
1. Check `docs/planning/PROGRESS.md` for overall project completion and milestone notes
2. Read the specific milestone doc in `docs/planning/M##-*.md` for detailed scope and caveats
3. Review `docs/DATABASE.md` if database changes are needed

### Starting Follow-up Work
1. Identify the target area (feature refinement, bug fix, docs, or operations)
2. Confirm current behavior in code and related milestone docs
3. Create a focused branch if needed
4. Implement and test changes
5. Update PROGRESS.md and the relevant milestone doc when behavior or status changes

### Database Changes
1. Modify `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name descriptive_name`
3. Update `docs/DATABASE.md` if schema significantly changes
4. Update seed script if needed for new data
5. Test migration with fresh database

### Adding Features
1. Follow Next.js App Router conventions
2. Use TypeScript strictly
3. Use TailwindCSS for styling (IVM green: `#2d5016`)
4. Follow responsive design patterns from M01
5. Add audit logging for sensitive operations

## Important Conventions

### Code Style
- TypeScript with strict type checking
- Functional components with hooks
- Use Prisma for all database access
- Email templates stored in database (not hardcoded)
- Rate limiting on authentication endpoints

### Security
- Never expose sensitive data in client components
- Validate all user inputs
- Use prepared statements (Prisma handles this)
- Log authentication events to AuditLog
- Check verificationStatus before granting access

### Testing
- Manual test procedures in each milestone doc
- Jest unit tests and Playwright E2E infrastructure are in place (M18)
- E2E tests for critical workflows
- See `docs/planning/90-testing-strategy.md`

## Environment Setup

### Required Environment Variables (.env)
```env
DATABASE_URL="postgresql://ivm_user:ivm_password@localhost:5432/ivm_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<generate-random-secret>"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="465"
EMAIL_USER="<your-email>"
EMAIL_PASS="<app-password>"
EMAIL_FROM="noreply@indianvillagemanor.com"
```

See `.env.example` for template.

## Known Issues & Resolutions

All major issues from M01 through M05 have been resolved:
- ✅ next-auth peer dependency (use --legacy-peer-deps)
- ✅ React hydration mismatch (default rendering in WindowWithSize)
- ✅ NextAuth SESSION_FETCH_ERROR (real API route now configured)
- ✅ Modal image 400 error (early return fix)
- ✅ Tailwind border-border class (removed from CSS)
- ✅ Schema alignment (removed isResident/isOwner fields)
- ✅ Idempotent seed script (safe to run multiple times)
- ✅ Prisma named exports (use `{ prisma }` import)
- ✅ TypeScript linting errors (removed `any` types, unused parameters)
- ✅ useSearchParams Suspense boundary (wrapped in error page)
- ✅ Zod validation error handling (use safeParse, check `.issues` not `.errors`)
- ✅ Role-based user creation (resident/owner roles, no boolean fields)

## Current Focus Areas

The milestone roadmap is complete. Current work should focus on maintenance and refinement.

**Recommended priorities**:
1. Keep status documents aligned with real implementation (especially milestone caveats)
2. Expand or tighten M20 performance/monitoring scope where desired
3. Continue hardening operational runbooks and incident procedures

**See**: `docs/planning/PROGRESS.md` and milestone docs for implementation details

## Tips for Future Agents

1. **Always check PROGRESS.md first** to understand current state
2. **Read the milestone doc** before starting work on a milestone
3. **Don't skip manual testing** - each milestone has specific test procedures
4. **Update PROGRESS.md** when completing milestones
5. **Follow existing patterns** - UI patterns in M01, data patterns in M02
6. **Database changes require migrations** - never edit schema.prisma without migrating
7. **Seed script is idempotent** - safe to run repeatedly
8. **Reference project exists** - check `IndianVillageManor/ivm_app` when in doubt about UI
9. **Audit logging is critical** - log all sensitive operations
10. **Security matters** - this is a real HOA site, not a toy project

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth Docs](https://next-auth.js.org)
- [TailwindCSS Docs](https://tailwindcss.com/docs)

## Contact & Support

This is a private project for Indian Village Manor HOA.

---

**Last Updated**: 2026-03-16 (post-M20 status refresh)
**Document Version**: 1.4
**For**: Future AI agents working on this project
