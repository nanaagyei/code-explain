# CodeExplain Deployment Guide

Complete step-by-step guide to deploy CodeExplain backend, frontend, database, and documentation.

## Prerequisites

### **System Requirements**
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: 2GB free space
- **Network**: Internet connection for dependencies

### **Required Software**
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Python** (3.8 or higher) - [Download](https://python.org/)
- **Docker Desktop** - [Download](https://docker.com/)
- **Git** - [Download](https://git-scm.com/)

### **Accounts & Keys**
- **OpenAI API Key** - [Get API Key](https://platform.openai.com/api-keys)
- **GitHub Account** (optional) - For repository integration

## Deployment Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │◄──►│   (FastAPI)     │◄──►│   (PostgreSQL)  │
│   Port: 3000    │    │   Port: 8000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Documentation │    │   Cache         │    │   File Storage   │
│   (Docusaurus)  │    │   (Redis)       │    │   (Local/Cloud)  │
│   Port: 3001    │    │   Port: 6379    │    │   Various        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Step-by-Step Deployment

### **Step 1: Clone and Setup Repository**

```bash
# Clone the repository
git clone https://github.com/codeexplain/codeexplain.git
cd codeexplain

# Verify you're in the correct directory
ls -la
# Should see: backend/, frontend/, docs/, docker-compose.yml
```

### **Step 2: Environment Configuration**

```bash
# Copy environment template
cp env.template .env

# Edit the .env file with your configuration
# Windows: notepad .env
# macOS/Linux: nano .env
```

**Required Environment Variables:**
```env
# Database Configuration
DATABASE_URL=postgresql://codeexplain:password@localhost:5432/codeexplain
REDIS_URL=redis://localhost:6379

# Security (Generate strong secrets)
SECRET_KEY=your-super-secret-key-here-minimum-32-characters
JWT_SECRET=your-jwt-secret-key-minimum-32-characters

# OpenAI Configuration (Required for AI features)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=False

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### **Step 3: Start Database Services**

```bash
# Start PostgreSQL and Redis with Docker
docker-compose up -d

# Verify services are running
docker-compose ps
# Should show: postgres, redis, pgadmin containers running
```

**Expected Output:**
```
Name                Command               State           Ports         
-------------------------------------------------------------------------
codeexplain-postgres-1   docker-entrypoint.sh postgres    Up      0.0.0.0:5432->5432/tcp
codeexplain-redis-1      docker-entrypoint.sh redis ...   Up      0.0.0.0:6379->6379/tcp
codeexplain-pgadmin-1    /entrypoint.sh                   Up      0.0.0.0:5050->80/tcp
```

### **Step 4: Backend Deployment**

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Verify database connection
python -c "
from app.core.database import engine
from sqlalchemy import text
with engine.connect() as conn:
    result = conn.execute(text('SELECT 1'))
    print('Database connection successful!')
"

# Start backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using StatReload
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### **Step 5: Frontend Deployment**

```bash
# Open new terminal and navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Expected Output:**
```
  VITE v5.0.0  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### **Step 6: Documentation Deployment**

```bash
# Open new terminal and navigate to docs
cd docs

# Install dependencies
npm install

# Start documentation server
npm start
```

**Expected Output:**
```
[INFO] Starting the development server...
[SUCCESS] Docusaurus website is running at: http://localhost:3001/
```

### **Step 7: Verify Deployment**

**Test Backend API:**
```bash
# Test health endpoint
curl http://localhost:8000/health

# Expected response:
# {"status": "healthy", "timestamp": "2024-01-01T00:00:00Z"}
```

**Test Frontend:**
- Open browser: http://localhost:3000
- Should see CodeExplain login page

**Test Documentation:**
- Open browser: http://localhost:3001
- Should see comprehensive documentation site

## Production Deployment

### **Option 1: Docker Compose (Recommended)**

```bash
# Create production environment file
cp env.template .env.prod

# Edit .env.prod with production values
# Set DEBUG=False, use production database URLs, etc.

# Build and start production services
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

### **Option 2: Manual Production Setup**

#### **Backend Production**
```bash
cd backend

# Install production dependencies
pip install gunicorn

# Run with Gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Or with systemd service
sudo systemctl start codeexplain-backend
sudo systemctl enable codeexplain-backend
```

#### **Frontend Production**
```bash
cd frontend

# Build production bundle
npm run build

# Serve with nginx or serve
npx serve -s dist -l 3000
```

#### **Database Production**
```bash
# Use managed PostgreSQL service
# AWS RDS, Google Cloud SQL, or Azure Database

# Or self-hosted PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## Cloud Deployment

### **AWS Deployment**

#### **Using AWS ECS**
```bash
# Build Docker images
docker build -t codeexplain-backend ./backend
docker build -t codeexplain-frontend ./frontend

# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
docker tag codeexplain-backend:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/codeexplain-backend:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/codeexplain-backend:latest

# Deploy with ECS
aws ecs create-service --cluster codeexplain-cluster --service-name codeexplain-backend --task-definition codeexplain-backend:1 --desired-count 1
```

#### **Using AWS RDS**
```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier codeexplain-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username codeexplain \
  --master-user-password your-secure-password \
  --allocated-storage 20
```

### **Google Cloud Deployment**

#### **Using Cloud Run**
```bash
# Build and deploy backend
gcloud builds submit --tag gcr.io/PROJECT_ID/codeexplain-backend ./backend
gcloud run deploy codeexplain-backend --image gcr.io/PROJECT_ID/codeexplain-backend --platform managed --region us-central1

# Build and deploy frontend
gcloud builds submit --tag gcr.io/PROJECT_ID/codeexplain-frontend ./frontend
gcloud run deploy codeexplain-frontend --image gcr.io/PROJECT_ID/codeexplain-frontend --platform managed --region us-central1
```

#### **Using Cloud SQL**
```bash
# Create Cloud SQL instance
gcloud sql instances create codeexplain-db --database-version=POSTGRES_15 --tier=db-f1-micro --region=us-central1
```

### **Azure Deployment**

#### **Using Container Instances**
```bash
# Deploy backend
az container create \
  --resource-group codeexplain-rg \
  --name codeexplain-backend \
  --image codeexplain-backend:latest \
  --ports 8000 \
  --environment-variables DATABASE_URL=your-azure-postgres-url

# Deploy frontend
az container create \
  --resource-group codeexplain-rg \
  --name codeexplain-frontend \
  --image codeexplain-frontend:latest \
  --ports 3000
```

## Monitoring & Logging

### **Application Monitoring**
```bash
# Backend logs
tail -f backend/logs/app.log

# Frontend logs (if using PM2)
pm2 logs codeexplain-frontend

# Database logs
docker-compose logs postgres

# Redis logs
docker-compose logs redis
```

### **Health Checks**
```bash
# Backend health
curl http://localhost:8000/health

# Database health
docker-compose exec postgres pg_isready

# Redis health
docker-compose exec redis redis-cli ping
```

### **Performance Monitoring**
```bash
# Monitor system resources
htop
# or
top

# Monitor Docker containers
docker stats

# Monitor database performance
docker-compose exec postgres psql -U codeexplain -d codeexplain -c "SELECT * FROM pg_stat_activity;"
```

## Troubleshooting

### **Common Issues**

#### **1. Port Already in Use**
```bash
# Find process using port
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

#### **2. Database Connection Failed**
```bash
# Check PostgreSQL status
docker-compose exec postgres pg_isready

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

#### **3. Redis Connection Failed**
```bash
# Check Redis status
docker-compose exec redis redis-cli ping

# Restart Redis
docker-compose restart redis

# Check logs
docker-compose logs redis
```

#### **4. Frontend Build Errors**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be 18+
```

#### **5. Backend Import Errors**
```bash
# Check Python version
python --version  # Should be 3.8+

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Check virtual environment
which python  # Should point to venv/bin/python
```

### **Performance Issues**

#### **Slow API Responses**
```bash
# Check database performance
docker-compose exec postgres psql -U codeexplain -d codeexplain -c "EXPLAIN ANALYZE SELECT * FROM repositories;"

# Monitor Redis cache hit rate
docker-compose exec redis redis-cli info stats | grep keyspace

# Check backend logs for slow queries
grep "slow" backend/logs/app.log
```

#### **High Memory Usage**
```bash
# Monitor memory usage
free -h  # Linux
vm_stat  # macOS
# Task Manager on Windows

# Restart services if needed
docker-compose restart
```

## Security Checklist

### **Production Security**
- [ ] Change default passwords
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Enable HTTPS/TLS
- [ ] Configure firewall rules
- [ ] Set up rate limiting
- [ ] Enable CORS properly
- [ ] Use environment variables for secrets
- [ ] Regular security updates
- [ ] Monitor access logs
- [ ] Backup database regularly

### **Environment Security**
```bash
# Set proper file permissions
chmod 600 .env
chmod 600 .env.prod

# Use secrets management
# AWS Secrets Manager, Azure Key Vault, or Google Secret Manager
```

## Scaling Considerations

### **Horizontal Scaling**
- **Load Balancer**: Nginx or AWS ALB
- **Multiple Backend Instances**: 2+ replicas
- **Database Replicas**: Read replicas for queries
- **Redis Cluster**: For high availability

### **Vertical Scaling**
- **Increase Resources**: More CPU/RAM
- **Database Optimization**: Indexes, query optimization
- **Caching Strategy**: Redis caching layers
- **CDN**: For static assets

## Next Steps

After successful deployment:

1. **Configure Domain**: Set up custom domain and SSL
2. **Set up Monitoring**: Application performance monitoring
3. **Backup Strategy**: Automated database backups
4. **CI/CD Pipeline**: Automated deployment pipeline
5. **Security Audit**: Regular security assessments

---

**Congratulations!** You've successfully deployed CodeExplain. Your AI-powered code documentation platform is now ready to revolutionize how you document and analyze code!

For additional help, check our [Documentation](/docs/getting-started/introduction) or [GitHub Issues](https://github.com/nanaagyei/code-explain/issues).
