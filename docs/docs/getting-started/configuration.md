# Configuration

This guide walks you through configuring Code Explain for local development and production. It covers required environment variables, per-service settings, and common setup patterns.

## Overview

Configuration is driven via environment variables. Use `env.template` at the repo root as a starting point for backend services and `frontend/env.example` for the frontend app.

- Backend env file: `.env` (based on `env.template`)
- Frontend env file: `frontend/.env` (based on `frontend/env.example`)
- Docker overrides: environment entries in `docker-compose.yml`

## Backend Configuration

Create `.env` at the repo root based on `env.template` and adjust values per your environment.

```bash
cp env.template .env
```

### Core

```bash
APP_NAME=CodeExplain
ENV=development
DEBUG=True
SECRET_KEY=replace-with-strong-random-value
```

- **APP_NAME**: Display/telemetry name for the app
- **ENV**: `development` | `staging` | `production`
- **DEBUG**: Enable verbose logging and debug features in dev only
- **SECRET_KEY**: Cryptographic secret. In production, generate with `openssl rand -hex 32`

### Database

```bash
DATABASE_URL=postgresql+asyncpg://codeexplain:dev_password@localhost:5432/codeexplain_db
```

- PostgreSQL URL for the backend API and job runners
- Use managed Postgres in production. Example: `postgresql://USER:PASS@HOST:5432/DB`

### Redis

```bash
REDIS_URL=redis://localhost:6379/0
```

- Used for caching, sessions, queues, and rate limiting

### OpenAI / LLM Providers

```bash
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL_GPT4=gpt-4o
OPENAI_MODEL_GPT4_MINI=gpt-4o-mini
```

- Set your API key and preferred models
- For Azure/OpenAI alternatives, add their respective envs and switch provider in service config

### Security

```bash
CORS_ORIGINS=["http://localhost:3000","http://localhost:8000"]
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

- Add all local dev URLs and deployed domains to `CORS_ORIGINS`
- Token expiration should be shorter in production for security

### Rate Limiting and Uploads

```bash
RATE_LIMIT_PER_MINUTE=20
MAX_FILE_SIZE_MB=10
```

- Tune limits by environment and plan tiers

## Frontend Configuration

Create `frontend/.env` based on `frontend/env.example`:

```bash
cp frontend/env.example frontend/.env
```

```bash
VITE_API_BASE_URL=http://localhost:8000
```

- In production, point to your deployed API, for example:

```bash
VITE_API_BASE_URL=https://api.yourdomain.com
```

## Local Development

### Start Dependencies

- Start Postgres and Redis (via Docker):

```bash
docker compose up -d db redis
```

- Apply migrations and start services (examples):

```bash
# Backend
npm run db:migrate
npm run dev:api

# Frontend
cd frontend
npm install
npm run dev
```

### Verifying Setup

- Backend health: `GET http://localhost:8000/health`
- Frontend: visit `http://localhost:3000`
- Docs site: inside `docs/`, run `npm install && npm start`

## Production Configuration

- Disable debug: `DEBUG=False`
- Strong `SECRET_KEY` stored in a secret manager
- Managed Postgres and Redis (HA)
- Hardened CORS: only your domains
- HTTPS/TLS termination at the edge
- Configure logging/metrics sinks

### Example Production Overrides

```bash
ENV=production
DEBUG=False
DATABASE_URL=postgresql://user:pass@prod-db:5432/codeexplain
REDIS_URL=redis://prod-redis:6379/0
CORS_ORIGINS=["https://app.yourdomain.com"]
ACCESS_TOKEN_EXPIRE_MINUTES=15
RATE_LIMIT_PER_MINUTE=120
MAX_FILE_SIZE_MB=25
```

## Secrets Management

Use one of:
- Docker/Compose secrets
- Kubernetes secrets
- Cloud secret managers (AWS Secrets Manager, GCP Secret Manager, Azure Key Vault)

Never commit secrets to git. Rotate periodically.

## Troubleshooting Configuration

- Missing envs: service will error at startup; check logs
- CORS errors: ensure frontend origin exists in `CORS_ORIGINS`
- 401s from frontend: verify tokens and `VITE_API_BASE_URL`
- Rate-limit 429s: increase plan/limits or reduce request frequency

## Reference

- Root env template: `env.template`
- Frontend env template: `frontend/env.example`
- Compose services: `docker-compose.yml`
- Docs app config: `docs/docusaurus.config.ts` (site settings)


