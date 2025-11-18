#!/bin/sh
# Startup script for nginx on Railway
# Railway provides $PORT environment variable

# Set default port to 80 if PORT is not set
PORT=${PORT:-80}

# Replace PORT in nginx config
sed -i "s/listen 80;/listen ${PORT};/g" /etc/nginx/conf.d/default.conf

# Start nginx
exec nginx -g 'daemon off;'

