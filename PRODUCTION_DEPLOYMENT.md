# 🚀 Production Deployment Guide

## Overview

This guide explains how to deploy CodeXplain to production using Docker Compose. The production deployment includes:
- **Backend**: FastAPI server running with Gunicorn (4 workers)
- **Frontend**: React app served with Nginx
- **PostgreSQL**: Database server
- **Redis**: Caching layer

## Prerequisites

1. **Docker Desktop** installed and running
2. **Docker Compose** (comes with Docker Desktop)
3. **Production environment variables** configured

## Quick Start

### Step 1: Configure Environment Variables

Copy the template and edit `.env` file with production values:

```bash
cp env.template .env
```

**Required Production Variables:**
```env
# Database Configuration
DB_USER=codeexplain
DB_PASSWORD=your-strong-password-here
DB_NAME=codeexplain_db
DATABASE_URL=postgresql+asyncpg://codeexplain:your-password@postgres:5432/codeexplain_db

# Redis
REDIS_URL=redis://redis:6379/0

# Security (IMPORTANT: Use strong random secrets)
SECRET_KEY=your-super-secret-key-minimum-32-characters-generate-with-openssl-rand-hex-32
JWT_SECRET=your-jwt-secret-key-minimum-32-characters-generate-with-openssl-rand-hex-32

# OpenAI API (Required for AI features)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Production Settings
DEBUG=False
ENV=production
FRONTEND_PORT=80

# CORS (Set to your production domain)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Step 2: Generate Secure Secrets

**On Linux/macOS:**
```bash
openssl rand -hex 32  # Use for SECRET_KEY
openssl rand -hex 32  # Use for JWT_SECRET
```

**On Windows (Git Bash):**
```bash
openssl rand -hex 32  # Use for SECRET_KEY
openssl rand -hex 32  # Use for JWT_SECRET
```

### Step 3: Deploy to Production

**Option A: Using the Production Deployment Script (Recommended)**
```bash
./deploy-prod.sh
```

**Option B: Manual Deployment**
```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d --build

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## Access Points

After deployment, access your application at:

- **Frontend**: http://localhost (or port specified in FRONTEND_PORT)
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## Managing Services

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

### Stop Services
```bash
docker-compose -f docker-compose.prod.yml down
```

### Stop and Remove Volumes (⚠️ Deletes database data)
```bash
docker-compose -f docker-compose.prod.yml down -v
```

### Restart Services
```bash
docker-compose -f docker-compose.prod.yml restart
```

### Update Services
```bash
# Pull latest code, then:
docker-compose -f docker-compose.prod.yml up -d --build
```

## Production Considerations

### 1. Database Backups

**Create backup:**
```bash
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U codeexplain codeexplain_db > backup.sql
```

**Restore backup:**
```bash
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U codeexplain codeexplain_db < backup.sql
```

### 2. SSL/TLS Certificates

For production, use a reverse proxy (Nginx or Traefik) with SSL certificates:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. Monitoring

Monitor your services:
- **Docker stats**: `docker stats`
- **Service health**: `docker-compose -f docker-compose.prod.yml ps`

### 4. Resource Limits

Update `docker-compose.prod.yml` to add resource limits:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### 5. Environment Variables

Never commit `.env` file to version control. Use:
- `.env.example` for templates
- Secret management systems (AWS Secrets Manager, Azure Key Vault, etc.)

## Troubleshooting

### Services Won't Start
1. Check Docker is running: `docker info`
2. Check logs: `docker-compose -f docker-compose.prod.yml logs`
3. Verify `.env` file exists and has correct values

### Database Connection Errors
1. Check PostgreSQL is healthy: `docker-compose -f docker-compose.prod.yml ps postgres`
2. Verify DATABASE_URL in `.env` matches docker-compose configuration
3. Check database logs: `docker-compose -f docker-compose.prod.yml logs postgres`

### Frontend Can't Reach Backend
1. Check backend is running: `docker-compose -f docker-compose.prod.yml ps backend`
2. Verify ALLOWED_ORIGINS in `.env` includes your frontend URL
3. Check nginx logs: `docker-compose -f docker-compose.prod.yml logs frontend`

### Port Already in Use
1. Change port in `.env`: `FRONTEND_PORT=8080`
2. Or stop conflicting service: `docker-compose -f docker-compose.prod.yml down`

## Production Checklist

- [ ] Strong SECRET_KEY and JWT_SECRET generated
- [ ] DEBUG=False in .env
- [ ] Strong database password set
- [ ] OPENAI_API_KEY configured
- [ ] ALLOWED_ORIGINS set to production domain(s)
- [ ] SSL/TLS certificates configured (if using HTTPS)
- [ ] Database backup strategy in place
- [ ] Monitoring and logging configured
- [ ] Firewall rules configured
- [ ] Regular security updates scheduled

## Next Steps

1. Set up reverse proxy with SSL (Nginx, Traefik, or cloud load balancer)
2. Configure domain DNS to point to your server
3. Set up automated backups
4. Configure monitoring and alerting
5. Set up CI/CD pipeline for updates

## Public Internet Deployment

For deploying to the public internet (not localhost), see **[PUBLIC_DEPLOYMENT_GUIDE.md](PUBLIC_DEPLOYMENT_GUIDE.md)** for:
- VPS deployment (DigitalOcean, AWS, etc.)
- Domain configuration
- SSL certificate setup
- Nginx reverse proxy configuration
- Security hardening
- Automated backups

