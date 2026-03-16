# Deployment Guide

This guide covers deploying Indian Village Manor to production using Docker.

## Architecture

The production stack runs three containers:

```
Client → Nginx (port 80/443) → Next.js App (port 3000) → PostgreSQL (port 5432)
```

- **Nginx** - Reverse proxy, SSL termination, security headers, static file serving
- **App** - Next.js standalone server with Prisma ORM
- **PostgreSQL** - Database (PostgreSQL 16 Alpine)

## Prerequisites

- Linux server (Ubuntu 22.04+ recommended)
- Docker Engine 24+
- Docker Compose v2
- Domain name with DNS pointing to server (for SSL)
- SMTP credentials for email delivery

## Initial Deployment

### 1. Prepare the Server

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Create application directory
sudo mkdir -p /opt/ivm
sudo chown $USER:$USER /opt/ivm

# Create data directories
sudo mkdir -p /data/documents /data/logs /data/backups
sudo chown -R 1001:1001 /data/documents /data/logs
```

### 2. Clone the Repository

```bash
cd /opt/ivm
git clone <repository-url> .
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with production values:

```env
# Database - match docker-compose.prod.yml credentials
DATABASE_URL="postgresql://ivm_user:STRONG_PASSWORD_HERE@postgres:5432/ivm_db"

# Application URL (your domain)
NEXTAUTH_URL="https://yourdomain.com"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# Generate secure secrets
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
SESSION_SECRET="$(openssl rand -base64 32)"

# Email - SMTP connection string
EMAIL_SERVER="smtps://user:password@smtp.gmail.com:465"
EMAIL_FROM="Indian Village Manor <noreply@yourdomain.com>"

# SSO (optional)
# GOOGLE_CLIENT_ID="..."
# GOOGLE_CLIENT_SECRET="..."
```

Update database credentials in `docker-compose.prod.yml` to match `DATABASE_URL`:

```yaml
environment:
  POSTGRES_USER: ivm_user
  POSTGRES_PASSWORD: STRONG_PASSWORD_HERE
  POSTGRES_DB: ivm_db
```

### 4. Build and Start

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

This will:
1. Build the Next.js app (multi-stage Docker build)
2. Start PostgreSQL
3. Run Prisma migrations automatically (via docker-entrypoint.sh)
4. Start the Next.js server
5. Start Nginx reverse proxy

### 5. Seed the Database

On first deployment only:

```bash
docker compose -f docker-compose.prod.yml exec app npx prisma db seed
```

### 6. Verify Deployment

```bash
# Check container health
docker compose -f docker-compose.prod.yml ps

# Check health endpoint
curl http://localhost/api/health

# Check logs
docker compose -f docker-compose.prod.yml logs app
```

## SSL/TLS Configuration

### Option A: Certbot (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Update nginx/default.conf to include SSL
```

Update `nginx/default.conf` to add SSL server block:

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # ... same location blocks as port 80 config
}
```

Mount certificates in `docker-compose.prod.yml`:

```yaml
nginx:
  volumes:
    - /etc/letsencrypt:/etc/letsencrypt:ro
```

### Option B: Reverse Proxy (Cloudflare, AWS ALB, etc.)

If using an external reverse proxy for SSL, keep Nginx on port 80 and configure the external proxy to forward to it.

## Updating the Application

```bash
cd /opt/ivm

# Pull latest code
git pull origin main

# Rebuild and restart (migrations run automatically)
docker compose -f docker-compose.prod.yml up -d --build

# Verify
docker compose -f docker-compose.prod.yml ps
curl http://localhost/api/health
```

## Rolling Back

### Application Rollback

```bash
# Check out previous version
git log --oneline -5
git checkout <previous-commit>

# Rebuild
docker compose -f docker-compose.prod.yml up -d --build
```

### Database Rollback

See [DATABASE_MIGRATIONS.md](./DATABASE_MIGRATIONS.md) for migration rollback procedures.

```bash
# Roll back last migration
docker compose -f docker-compose.prod.yml exec app \
  npx prisma migrate resolve --rolled-back <migration-name>
```

## Container Management

```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f nginx
docker compose -f docker-compose.prod.yml logs -f postgres

# Restart a single service
docker compose -f docker-compose.prod.yml restart app

# Stop all services
docker compose -f docker-compose.prod.yml down

# Stop and remove volumes (DESTRUCTIVE - data loss)
docker compose -f docker-compose.prod.yml down -v
```

## Persistent Volumes

| Volume | Mount Point | Description |
|--------|-------------|-------------|
| `postgres_data` | PostgreSQL data dir | Database storage |
| `documents_data` | `/data/documents` | Uploaded committee documents |
| `logs_data` | `/data/logs` | Audit log files (JSON-lines) |

These volumes persist across container restarts and rebuilds.

## Health Checks

- **App**: `GET /api/health` - Returns database connectivity status
- **Nginx**: `GET /nginx-health` - Returns 200 if Nginx is running
- **PostgreSQL**: `pg_isready` command

All three containers have Docker health checks configured. Use `docker compose ps` to see health status.

## Troubleshooting

### App won't start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs app

# Common issues:
# - DATABASE_URL incorrect (can't connect to postgres)
# - Missing NEXTAUTH_SECRET
# - Migration failure
```

### Database connection issues

```bash
# Check PostgreSQL is running
docker compose -f docker-compose.prod.yml exec postgres pg_isready

# Check DATABASE_URL matches postgres credentials
docker compose -f docker-compose.prod.yml exec app env | grep DATABASE_URL
```

### Email not sending

```bash
# Check email configuration
docker compose -f docker-compose.prod.yml exec app env | grep EMAIL

# Check app logs for email errors
docker compose -f docker-compose.prod.yml logs app | grep -i email
```

### Nginx 502 Bad Gateway

The app container is not ready or has crashed:

```bash
docker compose -f docker-compose.prod.yml restart app
docker compose -f docker-compose.prod.yml logs app
```

### Disk space

```bash
# Check Docker disk usage
docker system df

# Clean unused images
docker image prune -a

# Check data volumes
du -sh /data/documents /data/logs
```
