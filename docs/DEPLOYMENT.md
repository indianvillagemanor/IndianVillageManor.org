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

- First deployment: follow sections 1 through 6, then section 8 (TLS renewal
  setup). Section 8 is **not optional** — the certificate issued in section 4
  will not renew itself until the authenticator is switched to `webroot`.
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
- DNS A/AAAA records for both `$HOSTNAME` and `www.$HOSTNAME` pointing to this server
- SMTP credentials for email delivery

Verify DNS before certificate issuance. Both names must resolve to this server,
because the certificate covers both and each is validated independently:

```bash
dig +short "$HOSTNAME"
dig +short "www.$HOSTNAME"
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

Install certbot and create the ACME webroot that nginx will serve challenges
from:

```bash
sudo apt install -y certbot
sudo mkdir -p /var/www/certbot
```

The *first* certificate is issued with `--standalone` because nginx is not
running yet and so cannot serve the challenge itself. Section 8 switches the
authenticator to `webroot` immediately afterwards — do not skip it, or renewal
will fail 60 days later.

Issue for both the apex and `www` (see section 1: both DNS records must exist):

```bash
sudo certbot certonly --standalone \
  --cert-name "$HOSTNAME" \
  -d "$HOSTNAME" -d "www.$HOSTNAME" \
  --agree-tos -m "$ADMIN_EMAIL" --non-interactive
sudo ls -l "/etc/letsencrypt/live/$HOSTNAME/"
```

Both names must be on the certificate. nginx redirects `www` to the apex, but
it has to complete the TLS handshake before it can send that redirect, so a
certificate missing `www` produces a hard name-mismatch error rather than a
redirect.

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
curl -sI "https://www.$HOSTNAME" | head -1        # expect 301 to the apex

# Required after any change to nginx/templates/default.conf.template.
# Renewal depends on the ACME location block but only exercises it once every
# 60 days, so a regression there stays invisible for two months.
sudo certbot renew --dry-run
```

## 8. TLS Renewal

Renewal is fully automatic once configured: the `certbot.timer` systemd unit
installed by the `certbot` package runs `certbot renew` twice daily and acts
when the certificate is within 30 days of expiry. There is **no custom cron
entry** and nginx is never stopped.

### 8.1 Background: why this is not `--standalone`

This configuration previously used `authenticator = standalone`, which binds
port 80 to answer the ACME challenge. The nginx container holds port 80
permanently (`restart: unless-stopped`), so every renewal attempt failed with:

```text
Could not bind TCP port 80 because it is already in use by another process
```

The documented workaround was a hand-installed root cron entry that stopped
nginx, renewed, and started it again. That entry was never installed on the
production host, so renewal failed twice daily for roughly 85 days with no
output anywhere anyone looked, and the certificate expired on 2026-06-15.

Two properties of that design made it fail silently, and both are worth
avoiding in anything similar:

- `certbot renew --quiet` on a host with no MTA discards its own error output.
- The `stop nginx && certbot renew && start nginx` chain leaves nginx **stopped**
  if renewal exits non-zero, converting a soft failure into a hard outage.

`webroot` renewal has neither problem: nginx keeps running and serves the
challenge itself, so there is no window in which the site is down and no
custom scheduling to forget.

### 8.2 Switch the authenticator to webroot (one-time)

Requires the ACME location block in `nginx/templates/default.conf.template`
and the `/var/www/certbot` mount in `docker-compose.prod.yml`, both of which
ship in this repo. Deploy those first (section 7), then confirm nginx is
serving the challenge path over plain HTTP:

```bash
sudo mkdir -p /var/www/certbot/.well-known/acme-challenge
echo ok | sudo tee /var/www/certbot/.well-known/acme-challenge/probe >/dev/null

# Must print 200 and "ok". A 301 means the ACME block is missing or ordered
# below `location /`, and renewal will fail.
curl -s -o /dev/null -w '%{http_code}\n' "http://$HOSTNAME/.well-known/acme-challenge/probe"
curl -s "http://$HOSTNAME/.well-known/acme-challenge/probe"

sudo rm /var/www/certbot/.well-known/acme-challenge/probe
```

Only once that returns `200`/`ok`, rewrite the stored authenticator by
reissuing with `--webroot`:

```bash
sudo certbot certonly --webroot -w /var/www/certbot \
  --cert-name "$HOSTNAME" \
  -d "$HOSTNAME" -d "www.$HOSTNAME" \
  --non-interactive

# Confirm the change stuck
grep authenticator "/etc/letsencrypt/renewal/$HOSTNAME.conf"   # -> authenticator = webroot
```

`certbot renew` reads the authenticator from that renewal config file, so this
one command is what makes every future automatic renewal work.

### 8.3 Install the nginx reload hook

nginx caches the certificate in memory at startup, so a renewed certificate on
disk is invisible to the running process until it reloads. Without this hook
the site keeps serving the expired certificate even though renewal succeeded.

```bash
sudo install -m 0755 \
  "$APP_DIR/deploy/letsencrypt/renewal-hooks/deploy/reload-nginx.sh" \
  /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

The hook assumes the compose file is at `/opt/ivm/docker-compose.prod.yml`;
set `IVM_COMPOSE_FILE` in the environment if it is elsewhere.

### 8.4 Monitoring (see also `docs/MONITORING.md`)

Install the daily certificate check, which alerts both on impending expiry and
on a renewal that succeeded without nginx picking it up:

```bash
sudo mkdir -p /etc/ivm
sudo tee /etc/ivm/cert-check.env >/dev/null <<EOF
CERT_HOSTNAME="$HOSTNAME"
CERT_WARN_DAYS=21
HEALTHCHECK_URL="https://hc-ping.com/<your-uuid>"
EOF
sudo chmod 0600 /etc/ivm/cert-check.env

sudo tee /etc/cron.d/ivm-cert-check >/dev/null <<'EOF'
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
17 6 * * * root /opt/ivm/scripts/check-cert-expiry.sh >/dev/null
EOF
```

Run it once by hand to confirm it reports healthy:

```bash
sudo /opt/ivm/scripts/check-cert-expiry.sh; echo "exit=$?"
```

### 8.5 Verify the whole chain

```bash
# Dry run exercises the real authenticator without touching rate limits.
sudo certbot renew --dry-run

# Timer is active and scheduled
systemctl list-timers certbot.timer

# Certificate covers both names and is not close to expiry
sudo certbot certificates
curl -sSI "https://$HOSTNAME" >/dev/null && echo "apex OK"
curl -sSI "https://www.$HOSTNAME" >/dev/null && echo "www OK"
```

`certbot renew --dry-run` is the single most valuable check here: it performs a
real challenge against the staging server using the stored authenticator. If it
passes, automatic renewal will pass. **Re-run it after any change to the nginx
config**, since that is what silently broke last time.

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

If the cert is missing for that hostname, issue it. Run these as **separate
commands, not chained with `&&`** — chaining leaves nginx stopped if certbot
fails, turning a certificate problem into a full outage:

```bash
docker compose -f "$COMPOSE_FILE" stop nginx
sudo certbot certonly --standalone --cert-name "$HOSTNAME" \
  -d "$HOSTNAME" -d "www.$HOSTNAME" --expand \
  --agree-tos -m "$ADMIN_EMAIL" --non-interactive
sudo ls -l "/etc/letsencrypt/live/$HOSTNAME/"
docker compose -f "$COMPOSE_FILE" up -d nginx
```

Then follow section 8.2 to return the authenticator to `webroot`; leaving it on
`standalone` is what caused the 2026-06-15 expiry.

**Cause: git merge conflict markers in template** — logs show `unknown directive "<<<<<<"`; resolve the conflict in `nginx/templates/default.conf.template` and redeploy.

### Certificate expired, or expiring and not renewing

```bash
sudo certbot certificates                                   # expiry on disk
grep authenticator "/etc/letsencrypt/renewal/$HOSTNAME.conf"
sudo tail -50 /var/log/letsencrypt/letsencrypt.log          # the actual error
sudo /opt/ivm/scripts/check-cert-expiry.sh                  # disk vs served
```

Interpretation:

- `authenticator = standalone` — renewal is colliding with the nginx container
  on port 80. Apply section 8.2.
- `Could not bind TCP port 80` in the log — same cause.
- On-disk certificate valid but the served one expired — nginx never reloaded.
  Install the deploy hook (section 8.3), then
  `docker compose -f "$COMPOSE_FILE" exec nginx nginx -s reload`.
- 301 instead of 200 on the challenge path — the ACME block is missing from the
  nginx template or is ordered below `location /`.

To recover a site that is already down, see section 8 and the immediate
reissue commands above.

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
