#!/bin/sh
# Startup script for nginx on Railway
# Railway provides $PORT environment variable

set -e  # Exit on error

# Set default port to 80 if PORT is not set
PORT=${PORT:-80}

echo "Starting nginx on port ${PORT}..."

# Check if nginx config exists
if [ ! -f /etc/nginx/conf.d/default.conf ]; then
    echo "ERROR: nginx config not found at /etc/nginx/conf.d/default.conf"
    exit 1
fi

# Check if HTML directory exists and has files
if [ ! -d /usr/share/nginx/html ] || [ -z "$(ls -A /usr/share/nginx/html)" ]; then
    echo "ERROR: HTML directory is empty or doesn't exist"
    echo "Contents of /usr/share/nginx/html:"
    ls -la /usr/share/nginx/html || true
    exit 1
fi

# Replace PORT in nginx config
sed -i "s/listen 80;/listen ${PORT};/g" /etc/nginx/conf.d/default.conf

# Test nginx configuration
echo "Testing nginx configuration..."
nginx -t

# Start nginx
echo "Starting nginx..."
exec nginx -g 'daemon off;'

