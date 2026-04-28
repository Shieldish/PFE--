# Database Migrations

This directory contains all Sequelize migration scripts for the Gestion des Stages database redesign.

## Directory Structure

```
migrations/
├── README.md                  # This file
├── seeders/                   # Sequelize seed files (reference/dev data)
└── rollback/                  # Manual rollback SQL scripts (per-migration)
```

Migration files follow the Sequelize naming convention:

```
YYYYMMDDHHMMSS-description.js
```

## Prerequisites

Install `sequelize-cli` globally or use `npx`:

```bash
npm install --save-dev sequelize-cli
# or
npm install -g sequelize-cli
```

## Running Migrations

### Run all pending migrations

```bash
npx sequelize-cli db:migrate
```

### Run migrations up to a specific file

```bash
npx sequelize-cli db:migrate --to YYYYMMDDHHMMSS-migration-name.js
```

### Check migration status

```bash
npx sequelize-cli db:migrate:status
```

## Rolling Back Migrations

### Undo the most recent migration

```bash
npx sequelize-cli db:migrate:undo
```

### Undo all migrations (full rollback)

```bash
npx sequelize-cli db:migrate:undo:all
```

### Undo back to a specific migration

```bash
npx sequelize-cli db:migrate:undo:all --to YYYYMMDDHHMMSS-migration-name.js
```

## Manual Rollback Scripts

Each migration has a corresponding SQL rollback script in `migrations/rollback/`.
These are provided for emergency use or when running outside of Sequelize CLI.

```bash
# Example: manually apply a rollback script
mysql -u $DATABASE_USER -p $DATABASE_NAME < migrations/rollback/rollback-<name>.sql
```

## Idempotency

All migrations use `IF NOT EXISTS` / `IF EXISTS` guards so they can be safely
re-run without causing errors. The `SequelizeMeta` table (managed by Sequelize CLI)
tracks which migrations have already been applied.

## Migration Order

Migrations must be applied in order due to foreign key dependencies:

1. `user_registration` — central authentication table (no dependencies)
2. `etudiant`, `enseignant`, `encadrant`, `entreprise` — user type tables (depend on `user_registration`)
3. `stage` — depends on `entreprise`
4. `candidature` — depends on `stage` and `etudiant`
5. `affectation` — depends on `candidature`, `enseignant`, `encadrant`
6. `soutenance` — depends on `affectation`, `enseignant`, `encadrant`

## Environment Variables

Migrations read connection details from `.env` (via `config/sequelize-config.js`):

| Variable           | Description              | Default     |
|--------------------|--------------------------|-------------|
| `DATABASE_USER`    | MySQL username           | —           |
| `DATABASE_PASSWORD`| MySQL password           | —           |
| `DATABASE_NAME`    | Database name            | —           |
| `DATABASE_HOST`    | MySQL host               | `127.0.0.1` |
| `DATABASE_PORT`    | MySQL port               | `3306`      |
| `DATABASE_DIALECT` | Sequelize dialect        | `mysql`     |

## Requirements Traceability

- **10.5** — Migration scripts are idempotent and reversible
- **10.6** — Common query examples and join patterns are documented in `design.md`
