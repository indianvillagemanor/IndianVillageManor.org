# indianvillagemanor.org Recovery Instructions

Complete disaster recovery guide to rebuild the indianvillagemanor.org website from git repository and backups.

## Prerequisites

Before starting recovery, ensure you have access to:

- Git repository: `https://github.com/[username]/indianvillagemanor.org`
- Database backups (PostgreSQL dumps)
- Static content backups (uploaded files, documents, etc.)
- Environment configuration files
- SSL certificates (or ability to regenerate via Let's Encrypt)

## Initial Server Setup (Fresh Ubuntu Installation)

If you're starting with a fresh Ubuntu server that only has a root user, follow these steps:

### 1. Update System and Install Essential Packages

```bash
apt update && apt upgrade -y
apt install -y curl wget gnupg lsb-release ca-certificates software-properties-common
```

### 2. Create Admin User

```bash
# Create the ivm_admin user
adduser ivm_admin

# Add to sudo group
usermod -aG sudo ivm_admin

# Switch to the new user for remaining setup
su - ivm_admin
```

### 3. Install Docker

```bash
# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add ivm_admin to docker group
sudo usermod -aG docker ivm_admin

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Log out and back in for group changes to take effect
exit
su - ivm_admin
```

### 4. Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 5. Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 6. Install Additional Packages

```bash
sudo apt install -y git htop ufw fail2ban certbot python3-certbot-nginx
```

### 7. Configure Basic Firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## Recovery Process

### Step 1: Clone Repository

```bash
cd /home/ivm_admin
git clone https://github.com/[username]/indianvillagemanor.org.git
cd indianvillagemanor.org
```

### Step 2: Set Up PostgreSQL Database

```bash
# Create database user
sudo -u postgres createuser --interactive --pwprompt ivm_app

# Create databases
sudo -u postgres createdb -O ivm_app ivm_production
sudo -u postgres createdb -O ivm_app ivm_development

# Restore database from backup
sudo -u postgres psql ivm_production < /path/to/backup/ivm_production_backup.sql
```

**Note:** During the `createuser` command:

- **"Enter password for new role"**: Use the database password from your backup documentation
- **"Shall the new role be a superuser?"**: Answer **No**
- **"Shall the new role be allowed to create databases?"**: Answer **No**
- **"Shall the new role be allowed to create more new roles?"**: Answer **No**

### Step 3: Restore Environment Configuration

```bash
# Copy environment file from backup or recreate
cp /path/to/backup/.env ivm_app/.env

# OR create new .env file with required variables:
# DATABASE_URL=postgresql://ivm_app:password@localhost:5432/ivm_production
# NEXTAUTH_SECRET=your-secret-key
# NEXTAUTH_URL=https://indianvillagemanor.org
# JWT_SECRET=your-jwt-secret
# OAUTH_CLIENT_ID=your-oauth-client-id
# OAUTH_CLIENT_SECRET=your-oauth-client-secret
```

### Step 4: Restore Static Content

```bash
# Create uploads directory and restore files
mkdir -p ivm_app/public/uploads
cp -r /path/to/backup/uploads/* ivm_app/public/uploads/

# Restore any other static content
cp -r /path/to/backup/documents/* ivm_app/public/documents/
```

### Step 5: Build and Deploy Application

```bash
# Build Docker image
docker build -t ivm_app ./ivm_app

# Run production container
docker run -d -p 3000:3000 --env-file ivm_app/.env --name ivm_app ivm_app

# Verify container is running
docker ps
docker logs ivm_app
```

### Step 6: Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/indianvillagemanor.org
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name indianvillagemanor.org www.indianvillagemanor.org;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name indianvillagemanor.org www.indianvillagemanor.org;

    ssl_certificate /etc/letsencrypt/live/indianvillagemanor.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/indianvillagemanor.org/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/indianvillagemanor.org /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 7: Obtain SSL Certificates

```bash
# Get SSL certificates
sudo certbot --nginx -d indianvillagemanor.org -d www.indianvillagemanor.org

# Verify auto-renewal
sudo certbot renew --dry-run
```

### Step 8: Configure ListFix for Mailing Lists

```bash
# Install and configure ListFix according to your backup documentation
# This step depends on your specific ListFix setup and configuration
```

### Step 9: Set Up Automated Backups

```bash
# Create backup script
sudo nano /usr/local/bin/ivm_backup.sh
```

Add backup script content:

```bash
#!/bin/bash
BACKUP_DIR="/backups/ivm"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
sudo -u postgres pg_dump ivm_production > $BACKUP_DIR/ivm_production_$DATE.sql

# Backup static files
tar -czf $BACKUP_DIR/static_content_$DATE.tar.gz -C /home/ivm_admin/indianvillagemanor.org/ivm_app/public .

# Backup environment file
cp /home/ivm_admin/indianvillagemanor.org/ivm_app/.env $BACKUP_DIR/env_$DATE

# Upload to cloud storage (configure according to your cloud provider)
# aws s3 sync $BACKUP_DIR s3://your-backup-bucket/ivm/
# OR
# gsutil rsync -r $BACKUP_DIR gs://your-backup-bucket/ivm/

# Clean up old backups (keep last 7 days)
find $BACKUP_DIR -type f -mtime +7 -delete
```

```bash
# Make script executable
sudo chmod +x /usr/local/bin/ivm_backup.sh

# Add to crontab for daily backups at 2 AM
echo "0 2 * * * /usr/local/bin/ivm_backup.sh" | sudo crontab -
```

## Verification

After completing the recovery:

1. **Test website access**: Visit `https://indianvillagemanor.org`
2. **Test authentication**: Try logging in with existing accounts
3. **Test database connectivity**: Verify data is accessible
4. **Test file uploads**: Ensure document upload functionality works
5. **Test mailing lists**: Verify ListFix is functioning
6. **Check logs**: Review application and system logs for errors

```bash
# Check application logs
docker logs ivm_app

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Check system logs
sudo journalctl -u nginx -f
sudo journalctl -u postgresql -f
```

## Troubleshooting

### Common Issues

1. **Database connection errors**:

   - Verify PostgreSQL is running: `sudo systemctl status postgresql`
   - Check database credentials in `.env` file
   - Ensure database exists and user has proper permissions

2. **Docker container fails to start**:

   - Check environment variables: `docker logs ivm_app`
   - Verify port 3000 is not in use: `sudo netstat -tlnp | grep 3000`

3. **SSL certificate issues**:

   - Regenerate certificates: `sudo certbot --nginx -d indianvillagemanor.org -d www.indianvillagemanor.org`
   - Check certificate expiration: `sudo certbot certificates`

4. **File permission issues**:
   - Fix upload directory permissions: `sudo chown -R www-data:www-data ivm_app/public/uploads`

### Emergency Contacts

- Server hosting provider support
- Domain registrar support
- Database administrator contact information
- Application developer contact information

## Recovery Testing

Regularly test the recovery process in a staging environment to ensure:

- All backup files are complete and accessible
- Recovery scripts work correctly
- Documentation is up to date
- Recovery time meets business requirements

Schedule quarterly recovery drills to maintain readiness.
