# 🌐 Public Production Deployment Guide

This guide shows you how to deploy CodeXplain to production so it's accessible to users over the internet (not just localhost).

## Deployment Options

### Option 1: VPS (Virtual Private Server) - Recommended for Cost-Effectiveness
- **Providers**: DigitalOcean, Linode, Vultr, Hetzner, AWS EC2, Google Compute Engine, Azure VM
- **Cost**: $5-20/month for basic setup
- **Pros**: Full control, cost-effective, scalable
- **Cons**: Requires server management

### Option 2: Cloud Platforms (Easier but more expensive)
- **AWS**: ECS, Elastic Beanstalk, EC2
- **Google Cloud**: Cloud Run, Compute Engine
- **Azure**: Container Instances, App Service
- **Pros**: Managed services, easier setup
- **Cons**: Higher cost, vendor lock-in

### Option 3: Platform-as-a-Service (PaaS)
- **Railway**, **Render**, **Fly.io**, **Heroku**
- **Pros**: Very easy setup, managed infrastructure
- **Cons**: Can be expensive at scale, less control

## Step-by-Step: Deploy to a VPS (DigitalOcean Example)

### Step 1: Get a VPS

1. Sign up for DigitalOcean (or your preferred provider)
2. Create a Droplet:
   - **OS**: Ubuntu 22.04 LTS
   - **Size**: 2GB RAM minimum (4GB recommended)
   - **Region**: Choose closest to your users
   - **Add SSH keys** for secure access

### Step 2: Connect to Your Server

```bash
# Replace with your server's IP address
ssh root@your-server-ip
```

### Step 3: Install Docker and Docker Compose

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

### Step 4: Install Git

```bash
apt install git -y
```

### Step 5: Clone Your Repository

```bash
# Clone your repository
git clone https://github.com/your-username/code-explain.git
cd code-explain
```

### Step 6: Configure Environment Variables

```bash
# Copy template
cp env.template .env

# Edit .env file
nano .env
```

**Important Production Settings:**
```env
# Application
APP_NAME=CodeXplain
ENV=production
DEBUG=False
SECRET_KEY=your-strong-secret-key-here-minimum-32-chars
JWT_SECRET=your-jwt-secret-here-minimum-32-chars

# Database (using Docker service names)
DATABASE_URL=postgresql+asyncpg://codeexplain:STRONG_PASSWORD@postgres:5432/codeexplain_db
REDIS_URL=redis://redis:6379/0

# OpenAI
OPENAI_API_KEY=sk-your-actual-openai-key

# CORS - IMPORTANT: Set your actual domain
CORS_ORIGINS=["https://yourdomain.com","https://www.yourdomain.com"]

# Security
ACCESS_TOKEN_EXPIRE_MINUTES=15

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
MAX_FILE_SIZE_MB=25
```

**Generate secure secrets:**
```bash
openssl rand -hex 32  # Use for SECRET_KEY
openssl rand -hex 32  # Use for JWT_SECRET
```

### Step 7: Configure Frontend API URL

Create `frontend/.env`:
```bash
cd frontend
nano .env
```

Add:
```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

Or if using same domain:
```env
VITE_API_BASE_URL=https://yourdomain.com/api
```

### Step 8: Deploy with Docker Compose

```bash
# Go back to root directory
cd ..

# Build and start services
docker compose -f docker-compose.prod.yml up -d --build

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

### Step 9: Set Up Domain and SSL

#### Option A: Using Nginx as Reverse Proxy (Recommended)

**Install Nginx:**
```bash
apt install nginx certbot python3-certbot-nginx -y
```

**Configure Nginx:**
```bash
nano /etc/nginx/sites-available/codexplain
```

Add:
```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS configuration
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (will be added by Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000" always;

    # Frontend (served by Docker container on port 80)
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
    }

    # API endpoint (optional - if you want /api to proxy to backend)
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

**Enable site and get SSL certificate:**
```bash
# Enable site
ln -s /etc/nginx/sites-available/codexplain /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Get SSL certificate from Let's Encrypt
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Restart Nginx
systemctl restart nginx
```

**Update Docker Compose to expose on localhost only:**
In `docker-compose.prod.yml`, change:
```yaml
frontend:
  ports:
    - "127.0.0.1:80:80"  # Only accessible on localhost

backend:
  # Remove ports section or change to:
  ports:
    - "127.0.0.1:8000:8000"  # Only accessible on localhost
```

#### Option B: Using Cloudflare (Easier, Free SSL)

1. Add your domain to Cloudflare
2. Point DNS to your server IP
3. Enable "Flexible SSL" or "Full SSL"
4. Update CORS in `.env` to use HTTPS URLs

### Step 10: Configure Firewall

```bash
# Install UFW (Uncomplicated Firewall)
apt install ufw -y

# Allow SSH
ufw allow 22/tcp

# Allow HTTP and HTTPS (handled by Nginx)
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

### Step 11: Set Up Automatic Backups

```bash
# Install backup script
nano /root/backup.sh
```

Add:
```bash
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
docker compose -f /root/code-explain/docker-compose.prod.yml exec -T postgres pg_dump -U codeexplain codeexplain_db > $BACKUP_DIR/db_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "db_*.sql" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/db_$DATE.sql"
```

Make executable:
```bash
chmod +x /root/backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /root/backup.sh") | crontab -
```

### Step 12: Set Up Monitoring (Optional)

```bash
# Install monitoring tools
apt install htop -y

# Set up log rotation
nano /etc/logrotate.d/docker-logs
```

Add:
```
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=10M
    missingok
    delaycompress
    copytruncate
}
```

## Quick Deployment Checklist

- [ ] VPS server created and accessible
- [ ] Docker and Docker Compose installed
- [ ] Repository cloned to server
- [ ] `.env` file configured with production values
- [ ] Frontend `.env` configured with API URL
- [ ] Strong secrets generated (SECRET_KEY, JWT_SECRET)
- [ ] CORS_ORIGINS set to production domain(s)
- [ ] Docker containers running successfully
- [ ] Domain DNS pointing to server IP
- [ ] Nginx configured as reverse proxy
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] Firewall configured
- [ ] Backups configured
- [ ] Application accessible via domain

## Testing Your Deployment

1. **Check backend health:**
   ```bash
   curl https://yourdomain.com/api/health
   ```

2. **Check frontend:**
   - Visit `https://yourdomain.com` in browser
   - Should see login page

3. **Test API:**
   ```bash
   curl https://yourdomain.com/api/
   ```

## Troubleshooting

### Services won't start
```bash
# Check logs
docker compose -f docker-compose.prod.yml logs

# Check service status
docker compose -f docker-compose.prod.yml ps
```

### CORS errors
- Verify `CORS_ORIGINS` in `.env` includes your domain with `https://`
- Restart backend: `docker compose -f docker-compose.prod.yml restart backend`

### SSL certificate issues
```bash
# Renew certificate
certbot renew

# Check certificate status
certbot certificates
```

### Database connection errors
```bash
# Check database logs
docker compose -f docker-compose.prod.yml logs postgres

# Verify DATABASE_URL in .env matches Docker service name
```

## Alternative: Deploy to Railway (Easiest)

**See [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) for complete Railway deployment guide!**

Railway handles:
- SSL certificates automatically
- DNS (provides *.railway.app domain)
- Scaling
- Monitoring
- Zero server configuration needed

## Security Best Practices

1. **Never commit `.env` files**
2. **Use strong passwords** for database
3. **Rotate secrets** periodically
4. **Keep system updated**: `apt update && apt upgrade`
5. **Use fail2ban** to prevent brute force attacks
6. **Enable 2FA** for server access
7. **Regular backups** (automated)
8. **Monitor logs** for suspicious activity

## Next Steps

- Set up CI/CD pipeline for automatic deployments
- Configure monitoring and alerting (Prometheus, Grafana)
- Set up CDN for static assets (Cloudflare)
- Configure email service for notifications
- Set up staging environment

## Support

If you encounter issues:
1. Check application logs: `docker compose logs -f`
2. Check Nginx logs: `tail -f /var/log/nginx/error.log`
3. Verify environment variables are correct
4. Ensure domain DNS is properly configured

