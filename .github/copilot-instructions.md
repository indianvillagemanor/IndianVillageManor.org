# Copilot Instructions for Indian Village Manor (IVM)

## Project Overview

**Indian Village Manor Community Website** — a Next.js 15 HOA community portal with role-based access control, document management, event calendar, newsletter publishing, and a multi-step user verification workflow.

- **Project type**: Private HOA community portal
- **Bootstrap user email**: `indianvillagemanor+bootstrap@gmail.com`
- **All 21 milestones (M00–M20) are complete**

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Database | PostgreSQL via Docker + Prisma ORM |
| Styling | TailwindCSS (IVM green: `#2d5016`) |
| Email | Nodemailer |
| Auth | NextAuth v4 (magic link + Google + Microsoft/Azure AD SSO) |
| Testing | Jest (unit) + Playwright (E2E) |

## Repository Structure

```
app/                     # Next.js App Router pages & API routes
  api/                   # API route handlers
  auth/                  # Login, verify-request, error, forgot-email pages
  register/              # Registration form and confirmation
components/              # Shared React components
  site_menu.tsx          # Role-based navigation menu
  HeaderSection.tsx      # Fixed header with hamburger menu
lib/                     # Utilities (prisma, email, auth, audit, validation)
prisma/                  # Schema, migrations, seed script
  schema.prisma          # Database schema (8 models + NextAuth tables)
  seed.ts                # Idempotent seed script
types/                   # TypeScript declarations (next-auth.d.ts)
docs/planning/           # Milestone docs M00–M20, PROGRESS.md
__tests__/               # Jest unit tests
e2e/                     # Playwright E2E tests
public/images/           # Static image assets
```

## Development Commands

```bash
# Start database
docker-compose up -d

# Install dependencies
npm install --legacy-peer-deps

# Database setup
npx prisma migrate dev
npx prisma db seed          # Idempotent — safe to re-run
npx prisma generate

# Dev server
npm run dev                 # localhost:3000

# Linting & type-check
npm run lint
npm run typecheck

# Testing
npm test                    # Jest unit tests
npm run test:e2e            # Playwright E2E tests
npm run test:all            # lint + test + build
```

## Database Schema (Core Models)

1. **User** — `firstName`, `lastName`, `email`, `phone`, `unitNumber`, `verificationStatus` (`pending` | `verified` | `denied`)
2. **Role** — `name` (`dbadmin`, `publisher`, `calendar`, `verifier`, `user`, `owner`, `resident`)
3. **Committee** — `name`, `description`, many-to-many with User; `hasNewsletterFeature` flag
4. **Document** — `committeeId`, `title`, `description`, file path, `status` (`draft` | `published` | `archived` | `deleted`); `isNewsletter` + `thumbnailPath` for newsletter PDFs
5. **Event** — `title`, `description`, `startTime`, `endTime`, `location`
6. **AuditLog** — `userId`, `action`, `entityType`, `entityId`, `details`, `ipAddress`, `userAgent`
7. **SystemConfig** — key/value store for site configuration
8. **EmailTemplate** — reusable email templates (magic link, verification, approval, denial, etc.)

> **Important**: Users have roles via many-to-many relationship. There are **no** `isResident` or `isOwner` boolean fields on User (removed in migration `20260217190845`).

## Key Design Patterns

### Role-Based Access Control
- 7 roles seeded automatically; check role membership in middleware/API routes
- Never expose sensitive data in client components

### Verification Workflow
1. User registers → status `pending`
2. Verifier receives email notification
3. Verifier approves/denies → status → `verified` | `denied`
4. Email sent to user with outcome

### Document / Newsletter Lifecycle
- Document states: `draft` → `published` → `archived` → `deleted` (soft delete, restorable)
- Newsletter PDFs: `isNewsletter=true`, thumbnail generated via `pdftoppm` (`lib/pdf-thumbnail.ts`)
- Public newsletter listing: `/newsletters` page + `/api/newsletters` route

### Audit Logging
- Log all sensitive operations via `lib/audit.ts`
- Always include `ipAddress` and `userAgent`
- Logs written to volume-backed `/data/logs`

## Code Conventions

- **TypeScript strict** — no `any` types, no unused parameters
- **Functional components** with hooks; no class components
- **Prisma** for all database access (named import: `import { prisma } from '@/lib/prisma'`)
- **Email templates** stored in the database, not hardcoded
- **Zod** for input validation — use `safeParse`, check `.issues` not `.errors`
- **TailwindCSS** for all styling; primary color `#2d5016`
- Rate limiting on authentication endpoints

## Security Rules

- Never expose secrets or PII in client components or logs
- Validate all user inputs with Zod before processing
- Prisma parameterised queries prevent SQL injection
- Check `verificationStatus === 'verified'` before granting protected access
- Log all authentication events to `AuditLog`

## Database Change Checklist

1. Edit `prisma/schema.prisma`
2. `npx prisma migrate dev --name <descriptive_name>`
3. Update `docs/DATABASE.md` if the change is significant
4. Update `prisma/seed.ts` if new seed data is needed
5. Update `docs/planning/PROGRESS.md` when milestone status changes

## Environment Variables

See `.env.example`. Required variables:

```env
DATABASE_URL="postgresql://ivm_user:ivm_password@localhost:5432/ivm_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<random-secret>"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="465"
EMAIL_USER="<your-email>"
EMAIL_PASS="<app-password>"
EMAIL_FROM="noreply@indianvillagemanor.com"
```

## Reference Documentation

- `CLAUDE.md` — comprehensive agent navigation guide
- `docs/DESIGN.md` — full design specification
- `docs/DATABASE.md` — database schema documentation
- `docs/planning/PROGRESS.md` — milestone completion status
- `docs/planning/00-overview.md` — all milestone descriptions
