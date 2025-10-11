#!/bin/bash

# Setup script for Nginx configuration on Ubuntu server
# Run this script as root or with sudo

echo "Setting up Nginx for Indian Village Manor..."

# Install Nginx if not already installed
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    apt update
    apt install -y nginx
fi

# Install Certbot for SSL certificates
if ! command -v certbot &> /dev/null; then
    echo "Installing Certbot..."
    apt install -y certbot python3-certbot-nginx
fi

# First, set up HTTP-only configurations (SSL certs don't exist yet)
echo "Setting up initial HTTP-only configurations..."
cp indianvillagemanor.org-http.conf /etc/nginx/sites-available/
cp dev.indianvillagemanor.org-http.conf /etc/nginx/sites-available/
cp www-redirect-http.conf /etc/nginx/sites-available/

# Enable HTTP-only sites
echo "Enabling HTTP-only sites..."
ln -sf /etc/nginx/sites-available/indianvillagemanor.org-http.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/dev.indianvillagemanor.org-http.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/www-redirect-http.conf /etc/nginx/sites-enabled/

# Remove default Nginx site if it exists
if [ -f /etc/nginx/sites-enabled/default ]; then
    echo "Removing default Nginx site..."
    rm /etc/nginx/sites-enabled/default
fi

# Test HTTP-only configuration
echo "Testing HTTP-only Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "HTTP-only configuration is valid!"
    
    # Reload nginx with HTTP-only config
    systemctl reload nginx
    
    echo ""
    echo "Phase 1 Complete: HTTP-only setup"
    echo "================================="
    echo ""
    echo "Next steps:"
    echo "1. Make sure your Docker containers are running:"
    echo "   - Main site on port 3000"
    echo "   - Dev site on port 3001"
    echo ""
    echo "2. Test HTTP access (should work now):"
    echo "   - http://indianvillagemanor.org"
    echo "   - http://dev.indianvillagemanor.org"
    echo ""
    echo "3. Obtain SSL certificates:"
    echo "   sudo certbot --nginx -d indianvillagemanor.org -d www.indianvillagemanor.org"
    echo "   sudo certbot --nginx -d dev.indianvillagemanor.org"
    echo ""
    echo "4. After getting SSL certificates, run the SSL setup:"
    echo "   sudo ./setup-ssl.sh"
    echo ""
    echo "5. Enable Nginx to start on boot:"
    echo "   sudo systemctl enable nginx"
else
    echo "HTTP-only configuration has errors. Please check the configuration files."
    exit 1
fi
    echo "2. Obtain SSL certificates with Let's Encrypt:"
    echo "   sudo certbot --nginx -d indianvillagemanor.org -d www.indianvillagemanor.org"
    echo "   sudo certbot --nginx -d dev.indianvillagemanor.org"
    echo ""
    echo "3. Reload Nginx to apply changes:"
    echo "   sudo systemctl reload nginx"
    echo ""
    echo "4. Enable Nginx to start on boot:"
    echo "   sudo systemctl enable nginx"
else
    echo "Nginx configuration has errors. Please check the configuration files."
    exit 1
fi