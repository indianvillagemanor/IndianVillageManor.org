# Development Phases

## Phase 1: Foundation (M0-M4)
Focus: Basic infrastructure, authentication, and basic audit logging
Timeline: First deliverable for user acceptance testing
Deliverable: Anonymous site + bootstrap user login with logout

## Phase 2: User Management (M5-M8.5)
Focus: Registration, verification flows, and profile management
Timeline: Second deliverable - verifier workflow and profile management testable
Deliverable:
- User registration with firstName, lastName, email, phone, unit
- Pending users blocked from login
- Verifier approval/denial with emails
- Verified user access
- Profile management with re-verification

## Phase 3: Core Features (M9-M12)
Focus: Committees, documents with restore, events with calendar, admin console with bulk operations
Timeline: Third deliverable - full feature set
Deliverable:
- Committee system with many-to-many membership
- Document management (upload, publish, archive, delete, restore, trash)
- Event calendar with proper date filtering
- Admin console with bulk operations, SystemConfig management, EmailTemplate management

## Phase 4: Production Ready (M13-M20)
Focus: Security, deployment, operations, performance, monitoring
Timeline: Final deliverable - production deployment
Deliverable:
- Comprehensive audit logging to /data/logs volume
- SSO authentication (Google, Microsoft)
- Containerized deployment with persistent volumes
- Automated encrypted backups with recovery procedures
- [DATABASE_MIGRATIONS.md](../DATABASE_MIGRATIONS.md) for production deployments
- Security hardening
- Testing infrastructure and CI/CD
- Complete documentation ([DATABASE.md](../DATABASE.md) already done)
- Performance optimization and monitoring/alerting system
