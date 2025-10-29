# Database Migration Guide

## Creating a New Migration

When you add or modify database models, create a migration:

```bash
cd backend
alembic revision --autogenerate -m "Description of changes"
```

## Applying Migrations

To apply all pending migrations:

```bash
alembic upgrade head
```

## Viewing Migration History

To see all migrations:

```bash
alembic history
```

To see current migration:

```bash
alembic current
```

## Rolling Back

To rollback the last migration:

```bash
alembic downgrade -1
```

To rollback to a specific version:

```bash
alembic downgrade <revision_id>
```

