# CodeExplain Setup Guide

## Quick Start

### 1. Get OpenAI API Key

**Follow these steps to get your OpenAI API key:**

1. Go to https://platform.openai.com/signup
2. Create an account and verify your email
3. Navigate to https://platform.openai.com/api-keys
4. Click **"Create new secret key"**
5. Give it a name (e.g., "CodeExplain")
6. Copy the key (starts with `sk-...`)
   - **Important**: Save this key immediately - you won't be able to see it again!
7. Add billing credit:
   - Go to https://platform.openai.com/account/billing
   - Add $10-20 to start (should last for substantial testing)

### 2. Configure Environment

Once you have your API key, create a `.env` file in the `backend` directory:

```bash
# From the project root
cd backend
```

Create a file named `.env` with this content:

```env
# Application
APP_NAME=CodeExplain
ENV=development
DEBUG=True
SECRET_KEY=dev-secret-key-please-change-in-production-12345678

# Database
DATABASE_URL=postgresql+asyncpg://codeexplain:dev_password@localhost:5432/codeexplain_db

# Redis
REDIS_URL=redis://localhost:6379/0

# OpenAI API
OPENAI_API_KEY=sk-your-actual-key-here
OPENAI_MODEL_GPT4=gpt-4o
OPENAI_MODEL_GPT4_MINI=gpt-4o-mini

# Security
CORS_ORIGINS=["http://localhost:3000","http://localhost:8000"]
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Rate Limiting
RATE_LIMIT_PER_MINUTE=20
MAX_FILE_SIZE_MB=10
```

**Replace `sk-your-actual-key-here` with your actual OpenAI API key!**

### 3. Services Status

Your Docker services are running:
- PostgreSQL: http://localhost:5432
- Redis: http://localhost:6379
- pgAdmin: http://localhost:5050 (admin@codeexplain.com / admin)

You're all set! I'll continue building the backend once you provide the API key.
