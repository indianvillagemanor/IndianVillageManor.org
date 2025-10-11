# Nginx Configuration for Indian Village Manor

This directory contains Nginx configuration files for serving the Indian Village Manor website with HTTPS support.

## Files

- `indianvillagemanor.org.conf` - Main site configuration
- `dev.indianvillagemanor.org.conf` - Development site configuration
- `www-redirect.conf` - WWW to non-WWW redirect
- `setup.sh` - Automated setup script

## Setup Instructions

### Prerequisites

1. Completed initial server setup (see main README.md)
2. Domain names pointed to your server:
   - `indianvillagemanor.org`
   - `dev.indianvillagemanor.org`
   - `www.indianvillagemanor.org`
3. Docker containers running:
   - Main site on port 3000
   - Dev site on port 3001

### Installation

1. Copy the nginx directory to your server
2. Run the setup script as root:

   ```bash
   sudo ./setup.sh
   ```

3. Obtain SSL certificates:

   ```bash
   sudo certbot --nginx -d indianvillagemanor.org -d www.indianvillagemanor.org
   sudo certbot --nginx -d dev.indianvillagemanor.org
   ```

4. Start your Docker containers:

   ```bash
   # Main site
   docker run -d -p 3000:3000 --env-file .env --name ivm_app ivm_app

   # Dev site
   docker run -d -p 3001:3001 --env-file .env --name ivm_app_dev ivm_app
   ```

5. Reload Nginx:
   ```bash
   sudo systemctl reload nginx
   ```

## Configuration Details

- **HTTPS Only**: All HTTP traffic is redirected to HTTPS
- **Security Headers**: Includes modern security headers (HSTS, X-Frame-Options, etc.)
- **SSL/TLS**: Uses modern TLS protocols and ciphers
- **Proxy Setup**: Forwards requests to Docker containers with proper headers
- **WWW Redirect**: www.indianvillagemanor.org redirects to indianvillagemanor.org

## Port Mapping

- Port 3000: Main production site (indianvillagemanor.org)
- Port 3001: Development site (dev.indianvillagemanor.org)

## SSL Certificate Renewal

Certbot will automatically renew certificates. To test renewal:

```bash
sudo certbot renew --dry-run
```
