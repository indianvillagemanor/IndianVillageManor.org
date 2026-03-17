# Deployment Guide (Parameterized by Hostname)

This is the canonical deployment and redeployment guide for IVM. It supports both
primary production and test/staging servers by parameterizing hostname and paths.

## Parameters

Set these once on your target server shell and reuse them in commands below.

```bash
export HOSTNAME="indianvillagemanor.org"   # Example: sb.stevenlevis.com
export ADMIN_EMAIL="admin@example.com"
export APP_DIR="/opt/ivm"
export COMPOSE_FILE="docker-compose.prod.yml"
export REPO_URL="<repository-url>"
```

## Quick Start Paths

- First deployment: follow sections 1 through 6, then section 8 (TLS renewal setup).
- Redeployment after source changes: go directly to section 7, then run section 6 verification.

## Architecture

The stack runs three containers:

```text
Client -> Nginx (80/443) -> Next.js app (3000) -> PostgreSQL (5432)
```

- Nginx: reverse proxy, SSL termination, security headers
- App: Next.js standalone server + Prisma ORM
- PostgreSQL: persistent database

## 1. Preconditions

- Linux server (Ubuntu 22.04+ recommended)
- Docker Engine 24+ and Docker Compose v2
- DNS A/AAAA record for `$HOSTNAME` pointing to this server
- SMTP credentials for email delivery

Verify DNS before certificate issuance:

```bash
dig +short "$HOSTNAME"
```

## 2. Server Setup (First Deployment Only)

If Docker is already installed and working, skip this section.

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release git ufw

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"

sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

sudo mkdir -p "$APP_DIR"
sudo chown -R "$USER":"$USER" "$APP_DIR"
```

## 3. Clone and Configure

```bash
cd "$APP_DIR"
git clone "$REPO_URL" .
cp .env.example .env
```

Update `.env` with your host-specific values:

```env
NEXTAUTH_URL="https://${HOSTNAME}"
NEXT_PUBLIC_APP_URL="https://${HOSTNAME}"
NEXTAUTH_SECRET="<openssl-rand-base64-32>"
SESSION_SECRET="<openssl-rand-base64-32>"

NGINX_HOST="${HOSTNAME}"

POSTGRES_USER="ivm_user"
POSTGRES_PASSWORD="<strong-db-password>"
POSTGRES_DB="ivm_db"

# Optional convenience value for host-side tools; docker-compose.prod.yml
# constructs the in-container DATABASE_URL from POSTGRES_* using host `postgres`.
DATABASE_URL="postgresql://ivm_user:<strong-db-password>@localhost:5432/ivm_db"

EMAIL_SERVER="smtps://username:password@smtp.example.com:465"
EMAIL_FROM="Indian Village Manor <noreply@${HOSTNAME}>"

GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
AZURE_AD_CLIENT_ID=""
AZURE_AD_CLIENT_SECRET=""
AZURE_AD_TENANT_ID="common"
```

Generate secrets quickly:

```bash
openssl rand -base64 32
```

For production deployments, `POSTGRES_USER`, `POSTGRES_PASSWORD`, and
`POSTGRES_DB` are required in `.env`. `docker-compose.prod.yml` does not use the
host-side `DATABASE_URL` value for the app or migration containers.

## 4. TLS Certificate (First Deployment Only)

Install certbot, issue certificate, then verify files exist:

```bash
sudo apt install -y certbot
sudo certbot certonly --standalone -d "$HOSTNAME" --agree-tos -m "$ADMIN_EMAIL" --non-interactive
sudo ls -l "/etc/letsencrypt/live/$HOSTNAME/"
```

No manual nginx config editing is required. The nginx container reads
`nginx/templates/default.conf.template` and substitutes `${NGINX_HOST}` at
startup from the value set in `.env`. As long as `NGINX_HOST` in `.env` matches
the hostname your certificate was issued for, nginx will start cleanly.

## 5. Build and Start (First Deployment)

Start app stack in a first-boot-safe order:

```bash
cd "$APP_DIR"

# Start postgres + app first (migrations run via migrate service)
docker compose -f "$COMPOSE_FILE" up -d --build postgres app

# Seed once on first deployment only
docker compose -f "$COMPOSE_FILE" run --rm --entrypoint "" migrate npx prisma db seed

# Start nginx only after cert files exist
docker compose -f "$COMPOSE_FILE" up -d nginx
```

## 6. Verify Deployment

```bash
cd "$APP_DIR"
docker compose -f "$COMPOSE_FILE" ps

# App health (bypasses nginx)
docker compose -f "$COMPOSE_FILE" exec app wget -qO- http://127.0.0.1:3000/api/health

# Nginx and public HTTPS
curl http://127.0.0.1/nginx-health
curl -I "https://$HOSTNAME"
```

## 7. Updating After Source Code Changes (Redeploy)

Use this for any app code, dependency, migration, or deployment-config changes.

```bash
cd "$APP_DIR"
git pull origin main

# Always include --build so runtime image stays in sync
docker compose -f "$COMPOSE_FILE" up -d --build

# If this fails, inspect the migration container first
docker compose -f "$COMPOSE_FILE" logs migrate --tail=200

# Verify after update
docker compose -f "$COMPOSE_FILE" ps
docker compose -f "$COMPOSE_FILE" exec app wget -qO- http://127.0.0.1:3000/api/health
curl http://127.0.0.1/nginx-health
curl -I "https://$HOSTNAME"
```

## 8. TLS Renewal

Test renewal manually:

```bash
sudo certbot renew --dry-run
```

If using standalone renewal, add cron to briefly stop nginx:

```bash
sudo crontab -e
```

```cron
15 3 * * * docker compose -f /opt/ivm/docker-compose.prod.yml stop nginx && certbot renew --quiet --standalone && docker compose -f /opt/ivm/docker-compose.prod.yml start nginx
```

Equivalent command with your parameters expanded:

```bash
docker compose -f "$APP_DIR/$COMPOSE_FILE" stop nginx && sudo certbot renew --quiet --standalone && docker compose -f "$APP_DIR/$COMPOSE_FILE" start nginx
```

## 9. Rollback

Application rollback:

```bash
cd "$APP_DIR"
git log --oneline -5
git checkout <previous-commit>
docker compose -f "$COMPOSE_FILE" up -d --build
```

Database rollback command (see `docs/DATABASE_MIGRATIONS.md` for process details):

```bash
docker compose -f "$COMPOSE_FILE" run --rm --entrypoint "" migrate \
  npx prisma migrate resolve --rolled-back <migration-name>
```

## 10. Operations Commands

```bash
cd "$APP_DIR"

# Logs
docker compose -f "$COMPOSE_FILE" logs -f app
docker compose -f "$COMPOSE_FILE" logs -f nginx
docker compose -f "$COMPOSE_FILE" logs -f postgres

# Restart one service
docker compose -f "$COMPOSE_FILE" restart app

# Stop all services
docker compose -f "$COMPOSE_FILE" down

# Destructive: remove volumes too
docker compose -f "$COMPOSE_FILE" down -v
```

## 11. Troubleshooting

### Nginx restart loop (cannot connect to port 80/443)

```bash
docker compose -f "$COMPOSE_FILE" logs nginx --tail=120
```

**Cause: missing or wrong cert files** — logs show `cannot load certificate ... No such file or directory`.

Check that `NGINX_HOST` in `.env` exactly matches the hostname your cert was issued for:

```bash
grep NGINX_HOST "$APP_DIR/.env"
sudo ls /etc/letsencrypt/live/
```

If the cert is missing for that hostname, issue it:

```bash
docker compose -f "$COMPOSE_FILE" stop nginx
sudo certbot certonly --standalone -d "$HOSTNAME" --agree-tos -m "$ADMIN_EMAIL" --non-interactive
sudo ls -l "/etc/letsencrypt/live/$HOSTNAME/"
docker compose -f "$COMPOSE_FILE" up -d nginx
```

**Cause: git merge conflict markers in template** — logs show `unknown directive "<<<<<<"`; resolve the conflict in `nginx/templates/default.conf.template` and redeploy.

### Prisma CLI not found

Do not run Prisma CLI inside `app` runtime container. Use `migrate` service:

```bash
docker compose -f "$COMPOSE_FILE" run --rm --entrypoint "" migrate npx prisma <command>
```

### Migrate container exits 1 during deploy

The `migrate` service runs `prisma migrate deploy`. Check its logs first:

```bash
docker compose -f "$COMPOSE_FILE" logs migrate --tail=200
```

Useful follow-up checks:

```bash
docker compose -f "$COMPOSE_FILE" run --rm --entrypoint "" migrate npx prisma migrate status
docker compose -f "$COMPOSE_FILE" ps
```

### Prisma P1000 authentication failed

If logs show `P1000: Authentication failed against database server`, the
`POSTGRES_USER` or `POSTGRES_PASSWORD` values in `.env` do not match the
credentials stored in the existing PostgreSQL data volume.

Important: `POSTGRES_*` environment variables are only used to initialize a new
database volume. Changing them later in `.env` does not update the existing
database user password inside Postgres.

Check the values currently configured for the deployment:

```bash
grep -E '^(POSTGRES_USER|POSTGRES_PASSWORD|POSTGRES_DB)=' "$APP_DIR/.env"
docker compose -f "$COMPOSE_FILE" exec postgres env | grep '^POSTGRES_'
```

If `.env` was changed after the database volume was created, either restore the
original credentials in `.env` or update the password inside Postgres to match.

If `.env` only contains `DATABASE_URL`, add the matching `POSTGRES_*` values and
redeploy. The production compose file uses `POSTGRES_*` to build the container
connection string.

### App health check without nginx

```bash
docker compose -f "$COMPOSE_FILE" exec app wget -qO- http://127.0.0.1:3000/api/health
```
