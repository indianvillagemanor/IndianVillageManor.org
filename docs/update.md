# Update Deployment Guide

This guide provides step-by-step instructions for updating the Indian Village Manor (IVM) application with the latest code changes and deploying to production.

## Prerequisites

- Server access with Docker and Docker Compose installed
- Git repository access
- Environment files configured (`.env` for production, `.env.dev` for development)
- Database backups recommended before major updates

## Update Process Overview

1. **Backup current state** (recommended)
2. **Fetch latest code** from repository
3. **Rebuild application** with new code
4. **Run database migrations** (if applicable)
5. **Deploy to production**
6. **Verify deployment**

---

## Step-by-Step Instructions

### 1. Backup Current State (Recommended)

Before applying updates, create a backup of the current database:

```bash
cd /home/levis/Development/IVM/ivm_app
./manage.sh backup
```

This creates a timestamped backup file (e.g., `backup_20241210_143000.sql`).

### 2. Fetch Latest Code

Navigate to the project directory and fetch the latest changes:

```bash
cd /home/levis/Development/IVM
git fetch origin
git pull origin main
```

**Alternative: Fetch specific branch or tag:**
```bash
git fetch origin
git checkout <branch-name-or-tag>
# or
git pull origin <specific-branch>
```

### 3. Check for New Dependencies

After fetching new code, check if there are new dependencies:

```bash
cd ivm_app
git diff HEAD~1 package.json
```

If `package.json` has changed, the rebuild step will install new dependencies automatically.

### 4. Rebuild Application

Rebuild the Docker image with the latest code:

```bash
cd /home/levis/Development/IVM/ivm_app
./manage.sh rebuild
```

This command will:
- Build a new Docker image with updated code
- Stop running containers
- Start containers with the new image

### 5. Database Migration (If Required)

If there are new database migrations, apply them:

**For Production:**
```bash
./manage.sh migrate
```

**For Development Environment:**
```bash
./manage.sh migrate-dev
```

**Check Migration Status:**
```bash
./manage.sh shell
npx prisma migrate status
exit
```

### 6. Verify Deployment

Check that all services are running correctly:

```bash
./manage.sh status
```

Expected output should show all services as "Up":
```
NAME           IMAGE      COMMAND                  SERVICE     CREATED        STATUS       PORTS
ivm_app        ivm_app    "docker-entrypoint.s…"   ivm_app     2 minutes ago  Up 2 minutes 0.0.0.0:3000->3000/tcp
ivm_postgres   postgres   "docker-entrypoint.s…"   postgres    2 minutes ago  Up 2 minutes 0.0.0.0:5432->5432/tcp
```

### 7. Test Application

Visit the application URLs to verify functionality:

- **Production:** http://localhost:3000
- **Development:** http://localhost:3001 (if running dev profile)

Test key functionality:
- [ ] Homepage loads correctly
- [ ] Authentication system works
- [ ] Database connections are functional
- [ ] Admin features accessible (if applicable)

---

## Alternative Deployment Methods

### Development Environment

To start both production and development environments:

```bash
./manage.sh start-dev
```

This runs:
- Production app on port 3000
- Development app on port 3001
- Shared PostgreSQL database

### Production Only

To start only the production environment:

```bash
./manage.sh start
```

### Hot Rebuild (Development)

For development with file watching (if supported):

```bash
./manage.sh stop
docker-compose --profile dev up -d
```

### Running Without Docker (Alternative)

If you have Docker issues, you can run the application directly with Node.js:

**Prerequisites:**
- Node.js 18+ installed
- PostgreSQL installed and running locally
- Git repository cloned

**Setup Steps:**

1. **Install PostgreSQL locally:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

2. **Create database and user:**
```bash
sudo -u postgres createuser --interactive --pwprompt ivm_user
sudo -u postgres createdb -O ivm_user ivm_db
```

3. **Set up environment:**
```bash
cd /home/levis/Development/IVM/ivm_app
cp .env.example .env
# Edit .env with your database credentials:
# DATABASE_URL="postgresql://ivm_user:your_password@localhost:5432/ivm_db"
```

4. **Install dependencies and build:**
```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
```

5. **Start the application:**
```bash
# Development mode (with hot reload)
npm run dev
# Production mode
npm run start
```

The app will be available at:
- Development: http://localhost:3000
- Production: http://localhost:3000

---

## Troubleshooting

### Common Issues

**1. Build Failures**
```bash
# Clean Docker cache and rebuild
docker system prune -f
docker-compose down
docker-compose build --no-cache
./manage.sh start
```

**2. Database Connection Issues**
```bash
# Check database status
./manage.sh db-shell
# If connection fails, restart postgres
docker-compose restart postgres
```

**3. Port Conflicts**
```bash
# Check what's using the ports
sudo lsof -i :3000
sudo lsof -i :5432
# Kill conflicting processes if needed
sudo kill -9 <PID>
```

**4. Migration Failures**
```bash
# Reset database (WARNING: destroys data)
./manage.sh db-reset
# Restore from backup
./manage.sh restore backup_YYYYMMDD_HHMMSS.sql
```

**5. User/Node Errors**

If you get "unable to find user node: no matching entries in passwd file":

**This typically occurs when the Docker image wasn't built properly on the production server.**

**First, try a complete clean rebuild:**
```bash
# Stop services and clean Docker cache
./manage.sh stop
docker system prune -f
docker rmi ivm_app

# Pull fresh base image and rebuild
docker pull node:24-alpine3.21
docker build --no-cache -t ivm_app .
./manage.sh start
```

**If the issue persists, check for production server differences:**
```bash
# Check Docker version compatibility
docker --version

# Check system architecture (production may be different from local)
uname -m
docker info | grep Architecture

# Check available disk space (builds can fail with low space)
df -h

# Check for corrupted Docker installation
docker run --rm node:24-alpine3.21 whoami
# Should output: node
```

**Alternative solutions if clean rebuild fails:**
```bash
# Option A: Try different platform specification
docker build --platform linux/amd64 --no-cache -t ivm_app .

# Option B: Use root user temporarily (for testing)
# Edit Dockerfile and comment out "USER node" line, then rebuild

# Option C: Use different Node base image
# Change Dockerfile first line to: FROM node:24-alpine
```

### Rollback Procedure

If the update causes issues, rollback to the previous version:

```bash
# 1. Stop current services
./manage.sh stop

# 2. Revert to previous commit
git log --oneline -10  # Find previous commit hash
git checkout <previous-commit-hash>

# 3. Rebuild with previous code
./manage.sh rebuild

# 4. Restore database backup (if needed)
./manage.sh restore backup_YYYYMMDD_HHMMSS.sql
```

---

## Automated Update Script

For regular updates, you can create an automated script:

```bash
#!/bin/bash
# save as update-ivm.sh

set -e

echo "Starting IVM update process..."

# Backup database
echo "Creating backup..."
cd /home/levis/Development/IVM/ivm_app
./manage.sh backup

# Fetch latest code
echo "Fetching latest code..."
cd /home/levis/Development/IVM
git fetch origin
git pull origin main

# Rebuild and deploy
echo "Rebuilding application..."
cd ivm_app
./manage.sh rebuild

# Run migrations
echo "Running migrations..."
./manage.sh migrate

# Verify deployment
echo "Verifying deployment..."
sleep 10
./manage.sh status

echo "Update complete! Visit http://localhost:3000 to verify."
```

Make it executable:
```bash
chmod +x update-ivm.sh
```

---

## Monitoring and Logs

### View Application Logs

```bash
# All services
./manage.sh logs

# Specific service
./manage.sh logs ivm_app
./manage.sh logs postgres

# Follow logs in real-time
./manage.sh logs -f
```

### Check Container Health

```bash
# Container status
docker-compose ps

# Resource usage
docker stats

# Inspect specific container
docker inspect ivm_app
```

---

## Environment Management

### Production Environment Variables

Ensure your `.env` file contains:
```
NEXTAUTH_SECRET=your-production-secret
NEXTAUTH_URL=https://your-domain.com
DATABASE_URL=postgresql://ivm_user:password@postgres:5432/ivm_db
POSTGRES_PASSWORD=your-postgres-password
```

### Development Environment Variables

Ensure your `.env.dev` file contains:
```
NEXTAUTH_SECRET=your-dev-secret
NEXTAUTH_URL=http://localhost:3001
DATABASE_URL=postgresql://ivm_user:password@postgres:5432/ivm_db
POSTGRES_PASSWORD=your-postgres-password
```

---

## Security Considerations

1. **Always backup before updates**
2. **Test in development environment first**
3. **Review code changes before deployment**
4. **Monitor logs after deployment**
5. **Keep environment variables secure**
6. **Regular security updates for dependencies**

---

## Support

For issues or questions:
1. Check the application logs: `./manage.sh logs`
2. Review this documentation
3. Check the main README.md for additional information
4. Consult the recovery.md guide for disaster recovery procedures

---

*Last Updated: December 10, 2025*