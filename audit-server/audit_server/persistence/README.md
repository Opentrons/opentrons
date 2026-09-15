# Audit-Server Persistence

## Overview

Audit-server uses two complementary systems for database management:

- **Folder migrator** (from `server-utils`): manages the persistence directory lifecycle — creating directories, handling reset markers, and maintaining version subdirectories for safe software downgrades.
- **Alembic**: manages all database schema changes — creating tables, adding/dropping/renaming columns, constraints, and data backfill.

The underlying database engine is SQLite (via Python's built-in `sqlite3` module), exposed through SQLAlchemy. Connections are configured to use **write-ahead logging (WAL)** for better concurrency.

## Directory Structure

```
/data/audit-server/        # persistence root (configured via OT_AUDIT_SERVER_persistence_directory)
  1/                       # version subdirectory (managed by folder migrator)
    audit_server.db        # SQLite database (schema managed by Alembic)
```

When the first Alembic revision is introduced, rename the version directory to encode the head revision, e.g. `1_<revision_hash>/`, and update `LATEST_VERSION_DIRECTORY` in `file_and_directory_names.py` to match.

## How It Works

On server startup:

1. `prepare_root()` creates or resets the persistence directory.
2. `MigrationOrchestrator` ensures the version subdirectory exists.
3. `alembic upgrade head` runs any pending schema migrations.

On first boot, this creates the database from scratch. On subsequent boots, only new migrations run — existing data is preserved.

## Developer Workflow

### Adding a schema change

1. Modify the ORM model in `orm_models.py`.
2. Autogenerate the migration:

   ```
   OT_AUDIT_SERVER_persistence_directory=/tmp/audit-server-alembic \
     uv run alembic revision --autogenerate -m "describe the change"
   ```

3. Review the generated file in `alembic/versions/` and adjust as needed.
4. Test:

   ```
   rm -rf /tmp/audit-server-alembic && mkdir -p /tmp/audit-server-alembic/1
   OT_AUDIT_SERVER_persistence_directory=/tmp/audit-server-alembic \
     uv run alembic upgrade head
   ```

> **Important:** Do not leave `OT_AUDIT_SERVER_persistence_directory` exported in
> your shell or in a `.env` file when running tests. The server only reads a
> `.env` file when `OT_AUDIT_SERVER_dot_env_path` is explicitly set. Without it,
> `persistence_directory` defaults to `automatically_make_temporary` so each
> test gets a fresh database.

### When to bump the folder version

Bump the version subdirectory (e.g., "1" to "2") when a migration is made that is incompatible with the previous schema in a way that requires data transformation outside Alembic (for example, restructuring on-disk files alongside the database).

### Useful commands

```
OT_AUDIT_SERVER_persistence_directory=/tmp/audit-server-alembic \
  uv run alembic upgrade head       # run all pending migrations
OT_AUDIT_SERVER_persistence_directory=/tmp/audit-server-alembic \
  uv run alembic current            # check database revision
uv run alembic history              # view migration history (no DB needed)
OT_AUDIT_SERVER_persistence_directory=/tmp/audit-server-alembic \
  uv run alembic downgrade -1       # roll back one step
OT_AUDIT_SERVER_persistence_directory=/tmp/audit-server-alembic \
  uv run alembic downgrade base     # roll back everything
```

# SQLite Notes

- Use `render_as_batch=True` (configured in env.py) for constraint and column modifications.
- Column renames are not auto-detected — replace the generated add+drop with `batch_alter_table`.
- Failed migrations can leave the database in a partial updated state — reset the temp database and re-run migrations.
- WAL mode is enabled at engine setup. Be aware that WAL leaves `-wal` and `-shm` sidecar files next to the database file.
