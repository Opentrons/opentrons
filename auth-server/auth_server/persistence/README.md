# Auth-Server Persistence

## Overview

Auth-server uses two complementary systems for database management:

- **Folder migrator** (from `server-utils`): manages the persistence directory lifecycle — creating directories, handling reset markers, and maintaining version subdirectories for safe software downgrades.
- **Alembic**: manages all database schema changes — creating tables, adding/dropping/renaming columns, constraints, and data backfill.

## Directory Structure

```
/data/auth-server/ # persistence root (configured via OT_AUTH_SERVER_persistence_directory)
1/ # version subdirectory (managed by folder migrator)
auth_server.db # SQLite database (schema managed by Alembic)
```

## How It Works

On server startup:

1. `prepare_root()` creates or resets the persistence directory
2. `MigrationOrchestrator` ensures the version subdirectory exists
3. `alembic upgrade head` runs any pending schema migrations

On first boot, this creates the database from scratch. On subsequent boots, only new migrations run — existing data is preserved.

## Developer Workflow

### Adding a schema change

1. Modify the ORM model in `orm_models.py`
2. Autogenerate the migration:
   `OT_AUTH_SERVER_persistence_directory=/tmp/auth-server-alembic \`
   `uv run alembic revision --autogenerate -m "describe the change"`
3. Review the generated file in `alembic/versions/` and adjust as needed
4. Test:
   `rm -rf /tmp/auth-server-alembic && mkdir -p /tmp/auth-server-alembic/1`
   `OT_AUTH_SERVER_persistence_directory=/tmp/auth-server-alembic \`
   `uv run alembic upgrade head`

### When to bump the folder version

Only bump the version subdirectory (e.g., "1" to "2") when a migration would break older software — such as dropping or renaming a column. Additive changes (new columns, new tables) stay within the same folder version.

### Useful commands

```
export OT_AUTH_SERVER_persistence_directory=/tmp/auth-server-alembic
uv run alembic upgrade head       # run all pending migrations
uv run alembic current            # check database revision
uv run alembic history            # view migration history
uv run alembic downgrade -1       # roll back one step
uv run alembic downgrade base     # roll back everything
```

# SQLite Notes

- Use `render_as_batch=True` (configured in env.py) for constraint and column modifications
- Column renames are not auto-detected — replace the generated add+drop with batch_alter_table
- Failed migrations can leave the database in a partial state — reset the temp database and re-run migrations
