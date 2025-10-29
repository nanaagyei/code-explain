# Installation

This guide will help you install and set up CodeExplain in your development environment.

## Prerequisites

Before installing CodeExplain, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **Python** (3.8 or higher)
- **Docker Desktop** (for local development services)
- **Git** (for version control)

### System Requirements

- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: 2GB free space
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)

## Installation Methods

### Method 1: Quick Start (Recommended)

Clone the repository and use Docker Compose for a complete setup:

```bash
# Clone the repository
git clone https://github.com/codeexplain/codeexplain.git
cd codeexplain

# Start all services with Docker Compose
docker-compose up -d

# Install dependencies
npm install
cd backend && pip install -r requirements.txt
```

### Method 2: Manual Installation

#### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
alembic upgrade head

# Start the backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

#### 3. Database Setup

CodeExplain uses PostgreSQL as the primary database and Redis for caching.

**Option A: Using Docker (Recommended)**

```bash
# Start PostgreSQL and Redis with Docker
docker run -d --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:15
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

**Option B: Local Installation**

- **PostgreSQL**: Install from [postgresql.org](https://www.postgresql.org/download/)
- **Redis**: Install from [redis.io](https://redis.io/download)

## Environment Configuration

Create a `.env` file in the backend directory with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/codeexplain
REDIS_URL=redis://localhost:6379

# Security
SECRET_KEY=your-super-secret-key-here
JWT_SECRET=your-jwt-secret-key

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=True

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `REDIS_URL` | Redis connection string | ✅ |
| `SECRET_KEY` | Application secret key | ✅ |
| `JWT_SECRET` | JWT signing secret | ✅ |
| `OPENAI_API_KEY` | OpenAI API key for AI features | ✅ |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `8000` |
| `DEBUG` | Debug mode | `False` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `*` |

## Database Setup

### 1. Create Database

```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE codeexplain;

-- Create user (optional)
CREATE USER codeexplain_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE codeexplain TO codeexplain_user;
```

### 2. Run Migrations

```bash
# Navigate to backend directory
cd backend

# Run database migrations
alembic upgrade head

# Verify tables were created
alembic current
```

## Verification

### 1. Backend Health Check

```bash
# Test backend API
curl http://localhost:8000/health

# Expected response:
# {"status": "healthy", "timestamp": "2024-01-01T00:00:00Z"}
```

### 2. Frontend Access

Open your browser and navigate to:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### 3. Database Connection

```bash
# Test database connection
python -c "
from app.core.database import engine
from sqlalchemy import text
with engine.connect() as conn:
    result = conn.execute(text('SELECT 1'))
    print('Database connection successful!')
"
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>
```

#### 2. Database Connection Failed

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql
```

#### 3. Redis Connection Failed

```bash
# Check Redis status
redis-cli ping

# Start Redis
redis-server
```

#### 4. Python Dependencies Issues

```bash
# Clear pip cache
pip cache purge

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

#### 5. Node.js Dependencies Issues

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Getting Help

If you encounter issues during installation:

1. **Check the logs**: Look at the console output for error messages
2. **Verify prerequisites**: Ensure all required software is installed
3. **Check environment variables**: Verify your `.env` file is configured correctly
4. **GitHub Issues**: Report issues on our [GitHub repository](https://github.com/codeexplain/codeexplain/issues)
5. **Discord Community**: Join our Discord for real-time help

## Next Steps

Once installation is complete:

1. **[Quick Start Guide](./quick-start.md)** - Create your first documentation
2. **[Configuration Guide](./configuration.md)** - Customize CodeExplain
3. **[Features Overview](../features/)** - Explore all available features

---

**Installation complete!** 🎉 You're ready to start using CodeExplain. Let's move on to the [Quick Start Guide](./quick-start.md) to create your first documentation.
