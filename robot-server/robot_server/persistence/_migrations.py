"""SQLite database migrations.

Adding new tables to the database is handled transparently
by SQLAlchemy. This simple migrations module exists to
allow us to modify existing tables when we need to.

- Add new, nullable columns
- Add new, non-nullable columns with default values
- Delete columns (possible, but ill-advised)
- Drop tables (possible, but ill-advised)

Since SQLAlchemy does not provide an interface for `ALTER TABLE`,
these migrations are defined using raw SQL commands, instead.
If we ever have more complicated migration needs, we should
bring in a tool like Alembic instead.

Database schema versions:

- Version 0
    - Initial schema version

- Version 1
    This migration adds the following nullable columns to the run table:

    - Column("state_summary, sqlalchemy.PickleType, nullable=True)
    - Column("commands", sqlalchemy.PickleType, nullable=True)
    - Column("engine_status", sqlalchemy.String, nullable=True)
    - Column("_updated_at", sqlalchemy.DateTime, nullable=True)
"""
import logging
from datetime import datetime, timezone
from typing import Optional
from typing_extensions import Final

import sqlalchemy

from ._tables import migration_table, run_table

_LATEST_SCHEMA_VERSION: Final = 2

_log = logging.getLogger(__name__)


def migrate(sql_engine: sqlalchemy.engine.Engine) -> None:
    """Migrate the database to the latest schema version.

    SQLAlchemy will transparently add missing tables, so
    migrations are only needed when columns are added to
    existing tables.

    NOTE: added columns should be nullable.
    """
    with sql_engine.begin() as transaction:
        starting_version = _get_schema_version(transaction)

        if starting_version is None:
            _log.info(
                f"Marking fresh database as schema version {_LATEST_SCHEMA_VERSION}."
            )
            _stamp_schema_version(transaction)

        elif starting_version == _LATEST_SCHEMA_VERSION:
            _log.info(
                f"Database has schema version {_LATEST_SCHEMA_VERSION}."
                " no migrations needed."
            )

        else:
            _log.info(
                f"Database has schema version {starting_version}."
                f" Migrating to {_LATEST_SCHEMA_VERSION}..."
            )

            if starting_version < 1:
                _log.info("Migrating database schema from 0 to 1...")
                _migrate_0_to_1(transaction)
            if starting_version < 2:
                _log.info("Migrating database schema from 1 to 2...")
                _migrate_1_to_2(transaction)

            _log.info("Database migrations complete.")
            _stamp_schema_version(transaction)


def _stamp_schema_version(transaction: sqlalchemy.engine.Connection) -> None:
    """Mark the database as having the latest schema version."""
    transaction.execute(
        sqlalchemy.insert(migration_table).values(
            created_at=datetime.now(tz=timezone.utc),
            version=_LATEST_SCHEMA_VERSION,
        )
    )


def _get_schema_version(transaction: sqlalchemy.engine.Connection) -> Optional[int]:
    """Get the current schema version of the database.

    Returns:
        The version found, or None if this is a fresh database that
            the migration system has not yet marked.
    """
    if _is_version_0(transaction):
        return 0

    select_latest_version = sqlalchemy.select(migration_table).order_by(
        sqlalchemy.desc(migration_table.c.version)
    )
    migration = transaction.execute(select_latest_version).first()

    return migration["version"] if migration is not None else None


def _is_version_0(transaction: sqlalchemy.engine.Connection) -> bool:
    """Check if the database is at schema version 0.

    This is a special case, because the schema version table wasn't
    added until version 1. Since version 1 also added run table columns,
    we know we're on schema version 0 if those columns are missing.
    """
    inspector = sqlalchemy.inspect(transaction)
    run_columns = inspector.get_columns(run_table.name)

    for column in run_columns:
        if column["name"] == "state_summary":
            return False

    return True


def _migrate_0_to_1(transaction: sqlalchemy.engine.Connection) -> None:
    """Migrate the database from schema 0 to schema 1."""
    add_summary_column = sqlalchemy.text("ALTER TABLE run ADD state_summary BLOB")
    add_commands_column = sqlalchemy.text("ALTER TABLE run ADD commands BLOB")
    # NOTE: The column type of `STRING` here is mistaken. SQLite won't recognize it,
    # so this column's type affinity will mistakenly default to `NUMERIC`.
    # It should be `VARCHAR`, to match what SQLAlchemy uses when creating a new
    # database from scratch. Fortunately, for this particular column, this inconsistency
    # is harmless in practice because of SQLite's weak typing.
    add_status_column = sqlalchemy.text("ALTER TABLE run ADD engine_status STRING")
    add_updated_at_column = sqlalchemy.text("ALTER TABLE run ADD _updated_at DATETIME")

    transaction.execute(add_summary_column)
    transaction.execute(add_commands_column)
    transaction.execute(add_status_column)
    transaction.execute(add_updated_at_column)


def _migrate_1_to_2(transaction: sqlalchemy.engine.Connection) -> None:
    """Migrate the database from schema 1 to schema 2."""
    add_completed_analysis_as_document_column = sqlalchemy.text(
        "ALTER TABLE analysis ADD completed_analysis_as_document VARCHAR"
    )
    transaction.execute(add_completed_analysis_as_document_column)
