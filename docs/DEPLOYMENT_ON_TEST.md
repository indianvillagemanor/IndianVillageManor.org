# Testing New Changes on the Staging Server (sb.stevenlevis.com)

Use this guide when you want to test a commit — especially one containing a database
migration — against a copy of live production data, without touching the production site.

## Overview

The workflow has five stages:

1. Dump the production database
2. Transfer it to the staging server (two hops: prod → local → staging)
3. Restore it on staging
4. Deploy the new code (migrations run automatically)
5. Optionally copy production document files to staging

---

## Prerequisites

- SSH access to both the production server and `sb.stevenlevis.com`
- The staging server already has the app deployed (`/opt/ivm`)
- Both servers use `docker-compose.prod.yml`

---

## Stage 1 — Dump the production database

SSH into the **production server** and run:

```bash
cd /opt/ivm
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U ivm_user -d ivm_db \
  > /tmp/prod_dump.sql

wc -l /tmp/prod_dump.sql   # sanity check — should be in the hundreds or thousands
```

`pg_dump` is read-only. Production is not affected.

---

## Stage 2 — Transfer the dump (two hops)

There is no direct SSH route between the production and staging servers.
Transfer via your local machine:

**Production → local:**
```bash
scp your-user@indianvillagemanor.org:/tmp/prod_dump.sql ~/prod_dump.sql
```

**Local → staging:**
```bash
scp ~/prod_dump.sql your-user@sb.stevenlevis.com:/tmp/prod_dump.sql
```

---

## Stage 3 — Restore on staging

SSH into the **staging server**.

**3a. Stop the app (keep postgres running):**
```bash
cd /opt/ivm
docker compose -f docker-compose.prod.yml stop app migrate nginx
```

**3b. Drop and recreate the database:**
```bash
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U ivm_user -d postgres -c "DROP DATABASE ivm_db;"

docker compose -f docker-compose.prod.yml exec postgres \
  psql -U ivm_user -d postgres -c "CREATE DATABASE ivm_db;"
```

**3c. Restore the dump:**
```bash
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U ivm_user -d ivm_db < /tmp/prod_dump.sql
```

Check the output for any lines starting with `ERROR`. A few warnings about roles are
normal; database errors are not.

---

## Stage 4 — Deploy and migrate

Still on the staging server, pull the new code and rebuild:

```bash
cd /opt/ivm
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
```

Check that the migration applied cleanly:

```bash
docker compose -f docker-compose.prod.yml logs migrate --tail=50
```

You should see `All migrations have been successfully applied.`

Verify the site is healthy:

```bash
docker compose -f docker-compose.prod.yml exec app wget -qO- http://127.0.0.1:3000/api/health
curl -I https://sb.stevenlevis.com
```

---

## Stage 5 — Copy document files (optional but recommended)

Documents are stored in a Docker named volume (`ivm_documents_data`), not in the
database. If you need real document files on staging, transfer them separately.

**On the production server** — archive the volume:
```bash
docker run --rm \
  -v ivm_documents_data:/data/documents:ro \
  -v /tmp:/out \
  alpine tar czf /out/prod_documents.tar.gz -C /data/documents .
```

**Transfer via local machine (two hops):**
```bash
# Production → local
scp your-user@indianvillagemanor.org:/tmp/prod_documents.tar.gz ~/prod_documents.tar.gz

# Local → staging
scp ~/prod_documents.tar.gz your-user@sb.stevenlevis.com:/tmp/prod_documents.tar.gz
```

**On the staging server** — extract into the volume:
```bash
docker run --rm \
  -v ivm_documents_data:/data/documents \
  -v /tmp:/in \
  alpine sh -c "tar xzf /in/prod_documents.tar.gz -C /data/documents"
```

No restart is needed. The app container reads the volume live.

---

## Notes

- The staging server's `.env` (credentials, `NEXTAUTH_URL`, etc.) is never touched
  by this process. It stays configured for `sb.stevenlevis.com`.
- Because the restored dump includes the `_prisma_migrations` history from production,
  Prisma will only apply migrations that production has not yet seen — exactly
  simulating what will happen when you deploy to production.
- After testing, staging can be left as-is or redeployed from `main` at any time.
