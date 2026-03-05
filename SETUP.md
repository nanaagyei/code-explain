# CodeXplain Setup Guide

This guide walks you through setting up CodeXplain for local development, including database migrations and environment configuration.

## Prerequisites

- **Node.js** (v18 or higher)
- **Python** (3.10 or higher)
- **Docker Desktop** (for PostgreSQL and Redis)
- **Git**

---

## Quick Start

### 1. Clone and Start Services

```bash
git clone https://github.com/nanaagyei/code-explain.git
cd code-explain

# Start PostgreSQL and Redis
docker compose up -d
```

### 2. Configure Environment

Copy the environment template and edit as needed:

```bash
cp env.template backend/.env
```

Edit `backend/.env` and set:

- **OPENAI_API_KEY** — Your OpenAI API key (required for AI features)
- **DATABASE_URL** — Must match Docker Compose (see below)
- **SECRET_KEY** — Use `openssl rand -hex 32` for production

**Important:** The project `docker-compose.yml` uses:
- PostgreSQL on host port **5433** (mapped from container 5432)
- Password: **devpassword123**
- Database: **codeexplain_db**
- User: **codeexplain**

Your `DATABASE_URL` should be:

```env
DATABASE_URL=postgresql+asyncpg://codeexplain:devpassword123@localhost:5433/codeexplain_db
```

If you use a different Docker setup or port, adjust accordingly.

### 3. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start the backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Frontend Setup

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

### 5. Access the App

- **Frontend:** http://localhost:5173 (or 3000, depending on Vite config)
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **pgAdmin:** http://localhost:5050 (admin@codeexplain.com / admin)

---

## Database Migrations

### Running Migrations

From the `backend` directory with your virtual environment activated:

```bash
alembic upgrade head
```

### "relation already exists" / DuplicateTableError

If you see:

```
DuplicateTableError: relation "users" already exists
```

Your database already has the schema, but the `alembic_version` table is empty or out of sync. Alembic thinks it needs to run from scratch.

**Fix:** Stamp the database to mark all migrations as applied (without running them):

```bash
cd backend
venv\Scripts\activate   # Windows
alembic stamp head
```

This tells Alembic the database is already at the latest revision. After stamping, run `alembic upgrade head` again—it should report "Already at head" and no changes will be applied.

**Only use this if** your schema is already complete. If you have a partially migrated database, stamp with the specific revision you're at instead: `alembic stamp <revision_id>`.

### Multiple Heads Error

If you see:

```
ERROR: Multiple head revisions are present for given argument 'head'
```

A merge migration has been added (`a1b2c3d4e5f6_merge_migration_heads.py`) to resolve this. Ensure you have the latest migrations and run:

```bash
alembic upgrade head
```

If the error persists, check for multiple heads:

```bash
alembic heads
```

You should see a single head. If not, create a merge migration:

```bash
alembic merge -m "merge heads" <head1> <head2>
```

### Checking Migration Status

```bash
# Current revision in database
alembic current

# List all heads
alembic heads

# Migration history
alembic history
```

### Fresh Database

To reset the database and re-run all migrations:

```bash
# Drop and recreate (use with caution)
alembic downgrade base
alembic upgrade head
```

---

## Environment Variables

The project uses `env.template` at the project root. Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection (asyncpg driver) | See above |
| `REDIS_URL` | Redis connection | `redis://localhost:6379/0` |
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `SECRET_KEY` | App secret | Required |
| `CORS_ORIGINS` | Allowed origins | `["http://localhost:3000","http://localhost:8000"]` |
| `STRIPE_*` | Stripe billing (optional) | See env.template |

For the full list, see [env.template](env.template).

---

## Docker Services

| Service | Port | Credentials |
|---------|------|-------------|
| PostgreSQL | 5433 (host) | codeexplain / devpassword123 |
| Redis | 6379 | - |
| pgAdmin | 5050 | admin@codeexplain.com / admin |

---

## Troubleshooting

### Database connection refused

- Ensure Docker services are running: `docker compose ps`
- Verify `DATABASE_URL` uses port **5433** (not 5432) when using the project's docker-compose
- Check PostgreSQL is ready: `docker compose logs postgres`

### Alembic "No module named 'asyncpg'"

Activate the backend virtual environment before running Alembic:

```bash
cd backend
venv\Scripts\activate   # Windows
# source venv/bin/activate   # macOS/Linux
alembic upgrade head
```

### OpenAI API errors

- Ensure `OPENAI_API_KEY` is set in `backend/.env`
- Add billing credit at https://platform.openai.com/account/billing

---

## Related Documentation

- [Installation Guide](docs/docs/getting-started/installation.md)
- [Quick Start](docs/docs/getting-started/quick-start.md)
- [Deployment](PUBLIC_DEPLOYMENT_GUIDE.md)
- [Implementation Status](IMPLEMENTATION_STATUS.md)
