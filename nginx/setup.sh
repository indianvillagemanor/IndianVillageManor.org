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

# Copy configuration files to Nginx sites-available
echo "Copying Nginx configuration files..."
cp indianvillagemanor.org.conf /etc/nginx/sites-available/
cp dev.indianvillagemanor.org.conf /etc/nginx/sites-available/
cp www-redirect.conf /etc/nginx/sites-available/

# Enable sites by creating symlinks in sites-enabled
echo "Enabling sites..."
ln -sf /etc/nginx/sites-available/indianvillagemanor.org.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/dev.indianvillagemanor.org.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/www-redirect.conf /etc/nginx/sites-enabled/

# Remove default Nginx site if it exists
if [ -f /etc/nginx/sites-enabled/default ]; then
    echo "Removing default Nginx site..."
    rm /etc/nginx/sites-enabled/default
fi

# Test Nginx configuration
echo "Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "Nginx configuration is valid!"
    
    echo "Next steps:"
    echo "1. Make sure your Docker containers are running:"
    echo "   - Main site on port 3000"
    echo "   - Dev site on port 3001"
    echo ""
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