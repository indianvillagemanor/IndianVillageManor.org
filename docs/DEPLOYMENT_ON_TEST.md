# Deployment on a Fresh VPS (Test Domain)

This guide deploys the full Indian Village Manor stack on a new VPS using:

- Domain: `https://server.domain.com`
- Runtime: Docker Compose
- Services: PostgreSQL + Next.js app + Nginx reverse proxy
- TLS: Let's Encrypt (Certbot on host)

Use this when you want a realistic production-like test without touching your primary domain.

## 1. Preconditions

You need:

- A fresh Ubuntu 24.04 VPS (recommended)
- SSH access as a sudo-capable user
- DNS control for `server.domain.com`
- SMTP credentials (for magic link email login)

## 2. Point DNS to the VPS

Create/verify DNS records:

- `A` record: `server.domain.com -> <your-vps-public-ip>`
- Optional `AAAA` record if your VPS has IPv6

Wait for propagation, then verify:

```bash
dig +short server.domain.com
```

It must resolve to your VPS IP before TLS issuance.

## 3. Initial Server Setup

SSH into the VPS and run:

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release git ufw

# Install Docker Engine + Compose plugin (official repository)
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Let your user run Docker commands without sudo (re-login after this)
sudo usermod -aG docker "$USER"
```

Configure firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status
```

## 4. Create Deployment Directory and Clone

```bash
sudo mkdir -p /opt/ivm
sudo chown -R "$USER":"$USER" /opt/ivm

cd /opt/ivm
git clone <your-repository-url> .
```

## 5. Create Production Environment File

```bash
cd /opt/ivm
cp .env.example .env
```

Edit `.env` with production-like test values:

```env
# Domain
NEXTAUTH_URL="https://server.domain.com"
NEXT_PUBLIC_APP_URL="https://server.domain.com"

# Strong secrets
NEXTAUTH_SECRET="<openssl-rand-base64-32>"
SESSION_SECRET="<openssl-rand-base64-32>"

# DB credentials used by docker-compose.prod.yml
POSTGRES_USER="ivm_user"
POSTGRES_PASSWORD="<strong-db-password>"
POSTGRES_DB="ivm_db"

# Email (required for magic link login)
EMAIL_SERVER="smtps://username:password@smtp.example.com:465"
EMAIL_FROM="Indian Village Manor <noreply@server.domain.com>"

# Optional SSO (leave blank to disable)
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

Important notes:

- The compose file builds `DATABASE_URL` from `POSTGRES_*` variables.
- If you enable Google/Microsoft SSO, update callback URLs in each provider console to use `https://server.domain.com`.

## 6. Install Certbot and Issue TLS Certificate

Install certbot on host:

```bash
sudo apt install -y certbot
```

Request certificate for test domain:

```bash
sudo certbot certonly --standalone -d server.domain.com --agree-tos -m you@example.com --non-interactive
```

Verify cert files exist:

```bash
sudo ls -l /etc/letsencrypt/live/server.domain.com/
```

## 7. Configure Nginx for HTTPS in the Container

Replace `nginx/default.conf` with:

```nginx
upstream nextjs {
    server app:3000;
}

server {
    listen 80;
    server_name server.domain.com;

  location /nginx-health {
    access_log off;
    return 200 "healthy\n";
    add_header Content-Type text/plain;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name server.domain.com;

    ssl_certificate /etc/letsencrypt/live/server.domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/server.domain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;

    client_max_body_size 50M;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    location /nginx-health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

## 8. Update Compose for Port 443 + Cert Mount

Edit `docker-compose.prod.yml` and update the `nginx` service:

```yaml
nginx:
  image: nginx:alpine
  container_name: ivm-nginx
  restart: unless-stopped
  depends_on:
    app:
      condition: service_healthy
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
    - /etc/letsencrypt:/etc/letsencrypt:ro
  healthcheck:
    test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost/nginx-health"]
    interval: 15s
    timeout: 5s
    retries: 3
  networks:
    - ivm-network
```

## 9. Build and Start the Full Stack

From `/opt/ivm`:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

What happens:

1. PostgreSQL starts and becomes healthy
2. `migrate` container runs Prisma migrations (`prisma migrate deploy`) and exits successfully
3. Nginx starts and proxies HTTPS traffic to the app

## 10. Seed Database (First Deployment Only)

```bash
docker compose -f docker-compose.prod.yml run --rm --entrypoint "node node_modules/prisma/build/index.js db seed" migrate
```

Why this command:

- The `app` runtime image is slim and does not include the Prisma CLI.
- The `migrate` image is built from the full builder stage and has the Prisma CLI and seed dependencies.

## 11. Verify Deployment

Check container status:

```bash
docker compose -f docker-compose.prod.yml ps
```

Check health endpoints:

```bash
curl -I https://server.domain.com
curl https://server.domain.com/api/health
curl http://127.0.0.1/nginx-health
```

Open in browser:

- `https://server.domain.com`
- `https://server.domain.com/auth/login`
- `https://server.domain.com/register`

## 12. Useful Runtime Commands

```bash
# Follow logs
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f nginx
docker compose -f docker-compose.prod.yml logs -f postgres

# Restart one service
docker compose -f docker-compose.prod.yml restart app

# Update code + redeploy
cd /opt/ivm
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
```

## 13. TLS Renewal

Let's Encrypt certs expire every 90 days.

Test renewal:

```bash
sudo certbot renew --dry-run
```

Because certbot standalone needs port 80, use a cron job that briefly stops Nginx container:

```bash
sudo crontab -e
```

Add:

```cron
15 3 * * * docker compose -f /opt/ivm/docker-compose.prod.yml stop nginx && certbot renew --quiet --standalone && docker compose -f /opt/ivm/docker-compose.prod.yml start nginx
```

If renewal fails, inspect:

```bash
sudo journalctl -u cron --since "1 day ago"
sudo ls -l /etc/letsencrypt/live/server.domain.com/
```

## 14. Smoke Test Checklist

Run this checklist after deployment:

1. Anonymous homepage loads on HTTPS without certificate warnings.
2. Login page sends a magic link email.
3. Magic link sign-in succeeds.
4. Registration flow works for a new test user.
5. Admin/verification routes are reachable with proper permissions.
6. `GET /api/health` reports `"status":"ok"` and database connected.
7. App, Nginx, and Postgres containers remain healthy for at least 10 minutes.

## 15. Tear Down (Optional)

To remove running containers but keep data volumes:

```bash
docker compose -f docker-compose.prod.yml down
```

To remove everything including volumes (destructive):

```bash
docker compose -f docker-compose.prod.yml down -v
```

---

If you later move to a permanent domain, update:

- `NEXTAUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- Nginx `server_name`
- TLS certificate domain
- OAuth callback URLs (if SSO enabled)
