#!/bin/bash

# SSL setup script - run AFTER obtaining SSL certificates
# Run this script as root or with sudo

echo "Setting up SSL configurations for Indian Village Manor..."

# Check if SSL certificates exist
if [ ! -f /etc/letsencrypt/live/indianvillagemanor.org/fullchain.pem ]; then
    echo "Error: SSL certificates for indianvillagemanor.org not found!"
    echo "Please run certbot first:"
    echo "  sudo certbot --nginx -d indianvillagemanor.org -d www.indianvillagemanor.org"
    exit 1
fi

if [ ! -f /etc/letsencrypt/live/dev.indianvillagemanor.org/fullchain.pem ]; then
    echo "Error: SSL certificates for dev.indianvillagemanor.org not found!"
    echo "Please run certbot first:"
    echo "  sudo certbot --nginx -d dev.indianvillagemanor.org"
    exit 1
fi

# Copy SSL-enabled configuration files
echo "Installing SSL-enabled configurations..."
cp indianvillagemanor.org.conf /etc/nginx/sites-available/
cp dev.indianvillagemanor.org.conf /etc/nginx/sites-available/
cp www-redirect.conf /etc/nginx/sites-available/

# Remove HTTP-only configurations
echo "Removing HTTP-only configurations..."
rm -f /etc/nginx/sites-enabled/indianvillagemanor.org-http.conf
rm -f /etc/nginx/sites-enabled/dev.indianvillagemanor.org-http.conf
rm -f /etc/nginx/sites-enabled/www-redirect-http.conf

# Enable SSL configurations
echo "Enabling SSL configurations..."
ln -sf /etc/nginx/sites-available/indianvillagemanor.org.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/dev.indianvillagemanor.org.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/www-redirect.conf /etc/nginx/sites-enabled/

# Test SSL configuration
echo "Testing SSL Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "SSL configuration is valid!"
    
    # Reload nginx with SSL config
    systemctl reload nginx
    
    echo ""
    echo "SSL Setup Complete!"
    echo "=================="
    echo ""
    echo "Your sites should now be accessible via HTTPS:"
    echo "- https://indianvillagemanor.org"
    echo "- https://dev.indianvillagemanor.org"
    echo "- https://www.indianvillagemanor.org (redirects to main site)"
    echo ""
    echo "HTTP traffic will automatically redirect to HTTPS."
else
    echo "SSL configuration has errors. Please check the configuration files."
    exit 1
fi