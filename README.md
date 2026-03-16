# Indian Village Manor - Community Website

A Next.js-based community portal for Indian Village Manor HOA with role-based access control, document management, event calendar, and user verification workflows.

## Features

- **Magic Link Authentication** - Passwordless login via email magic links
- **SSO Support** - Optional Google and Microsoft/Azure AD single sign-on
- **User Registration & Verification** - New users register and are verified by designated verifiers
- **Role-Based Access Control** - 7 roles: dbadmin, publisher, calendar, verifier, user, owner, resident
- **Committee Management** - Create committees, manage members, publish documents
- **Document Publishing** - Upload, publish, archive, and restore documents per committee
- **Event Calendar** - Create and manage events with month-grouped calendar view
- **Admin Console** - User management, system configuration, email templates, audit logs
- **Audit Logging** - Comprehensive logging of all sensitive operations
- **Security Hardened** - CSP headers, input sanitization, rate limiting, bot detection

## Prerequisites

- Node.js 20+
- Docker and Docker Compose
- npm

## Quick Start (Development)

### 1. Clone and Install

```bash
git clone <repository-url>
cd IVM
npm install
```

### 2. Start PostgreSQL

```bash
docker-compose up -d
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- `EMAIL_SERVER` - SMTP connection string for magic link emails
- `EMAIL_FROM` - Sender email address

See `.env.example` for all available configuration options including SSO.

### 4. Initialize Database

```bash
npx prisma migrate dev     # Run migrations
npx prisma db seed         # Seed bootstrap user, roles, configs, templates
npx prisma generate        # Generate Prisma client
```

The seed script is idempotent and safe to run multiple times.

### 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

**Bootstrap user**: `indianvillagemanor+bootstrap@gmail.com` (dbadmin + verifier roles)

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin pages (verify, console, committees)
│   ├── api/               # API routes (27 endpoints)
│   ├── auth/              # Auth pages (login, error, verify-request)
│   ├── committees/        # Committee pages
│   ├── dashboard/         # User dashboard
│   ├── events/            # Calendar/events pages
│   ├── profile/           # User profile
│   └── register/          # Registration flow
├── components/            # React components (header, menu, modal, grid)
├── lib/                   # Utilities
│   ├── auth.ts           # NextAuth configuration
│   ├── audit.ts          # Audit logging with bot detection
│   ├── email.ts          # Nodemailer setup
│   ├── magic-link.ts     # Magic link generation and validation
│   ├── monitoring.ts     # Application monitoring utilities
│   ├── notifications.ts  # Verifier and admin notifications
│   ├── prisma.ts         # Prisma client singleton
│   ├── sanitize.ts       # Input sanitization (XSS, SQL injection detection)
│   └── validation.ts     # Zod validation schemas
├── prisma/                # Database schema, migrations, seed
├── __tests__/             # Unit tests (Jest)
├── e2e/                   # E2E tests (Playwright)
├── scripts/               # Utility scripts (dev server, backups)
├── nginx/                 # Nginx reverse proxy config (production)
├── docs/                  # Planning and documentation
├── Dockerfile             # Multi-stage production build
├── docker-compose.yml     # Development database
└── docker-compose.prod.yml # Full production stack
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests (Jest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:e2e` | Run E2E tests (Playwright, requires running server) |
| `npm run typecheck` | Run TypeScript type checking |

## Database Management

```bash
npx prisma studio                          # Browse data in GUI
npx prisma migrate dev --name <name>       # Create new migration
npx prisma db seed                         # Seed data (idempotent)
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_URL` | Yes | Application URL (http://localhost:3000) |
| `NEXTAUTH_SECRET` | Yes | Secret key for NextAuth JWT |
| `EMAIL_SERVER` | Yes | SMTP connection string |
| `EMAIL_FROM` | Yes | Sender email address |
| `NEXT_PUBLIC_APP_URL` | Yes | Public application URL |
| `SESSION_SECRET` | Yes | Session encryption secret |
| `MAGIC_LINK_EXPIRY_MINUTES` | No | Magic link expiry time (default: 15) |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `AZURE_AD_CLIENT_ID` | No | Azure AD OAuth client ID |
| `AZURE_AD_CLIENT_SECRET` | No | Azure AD OAuth client secret |
| `AZURE_AD_TENANT_ID` | No | Azure AD tenant ID (default: common) |

## Production Deployment

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for Docker-based production deployment instructions.

## Operations

See [OPERATIONS.md](./docs/OPERATIONS.md) for backup, recovery, monitoring, and administrative procedures.

## Documentation

- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment
- [Operations Guide](./docs/OPERATIONS.md) - Day-to-day operations
- [API Reference](./docs/API.md) - REST API endpoints
- [Database Schema](./docs/DATABASE.md) - Complete schema documentation
- [Database Migrations](./docs/DATABASE_MIGRATIONS.md) - Migration procedures
- [Design Document](./docs/DESIGN.md) - Architecture and design specification
- [Development Progress](./docs/planning/PROGRESS.md) - Milestone tracking

## Tech Stack

- **Framework**: Next.js 15 (App Router, standalone output)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL 16 + Prisma ORM
- **Styling**: TailwindCSS
- **Authentication**: NextAuth v4 (magic link + OAuth)
- **Email**: Nodemailer
- **Testing**: Jest + Playwright
- **Containerization**: Docker (multi-stage build) + Nginx reverse proxy

## License

Private project for Indian Village Manor HOA.
