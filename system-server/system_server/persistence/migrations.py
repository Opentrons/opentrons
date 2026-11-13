"""SQLite database migrations.

Adding new tables to the database is handled transparently
by SQLAlchemy. This simple migrations module exists to
allow us to modify existing tables when we need to, and to
seed data that belongs with a schema change.

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
    - ``registration`` and ``migration`` tables

- Version 1
    - Adds the ``settings`` table
    - Seeds a default ``log_level`` settings entry
"""

import logging
from datetime import datetime, timezone
from typing import Final

import sqlalchemy

from .tables import SettingKey, migration_table, settings_table

_LATEST_SCHEMA_VERSION: Final = 1

_DEFAULT_LOG_LEVEL: Final = "warning"

_log = logging.getLogger(__name__)


def migrate(sql_engine: sqlalchemy.engine.Engine) -> None:
    """Migrate the database to the latest schema version.

    SQLAlchemy will transparently add missing tables, so
    migrations are only needed when columns are added to
    existing tables or when a schema change needs seed data.

    NOTE: added columns should be nullable.
    """
    with sql_engine.begin() as transaction:
        starting_version = _get_schema_version(transaction)

        if starting_version is None:
            _log.info(
                f"Marking fresh database as schema version {_LATEST_SCHEMA_VERSION}."
            )
            _seed_default_settings(transaction)
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
                _migrate_schema_0_to_1(transaction)

            _log.info("Database schema migrations complete.")
            _stamp_schema_version(transaction)


def _get_schema_version(transaction: sqlalchemy.engine.Connection) -> int | None:
    """Get the current schema version of the given database.

    Returns:
        The version found, or None if this is a fresh database that
            the migration system has not yet marked.
    """
    # It's important that this takes the highest schema version that we've seen,
    # not the most recent one to be added. If you downgrade robot software across
    # a schema boundary, the old software will leave the database at its newer schema,
    # but stamp it as having "migrated" to the old one. We need to see it as having
    # the newer schema, to avoid incorrectly doing a redundant migration when the
    # software is upgraded again later.
    select_latest_version = sqlalchemy.select(migration_table).order_by(
        sqlalchemy.desc(migration_table.c.version)
    )
    migration = transaction.execute(select_latest_version).first()

    return migration.version if migration is not None else None


def _stamp_schema_version(transaction: sqlalchemy.engine.Connection) -> None:
    """Mark the database as having the latest schema version."""
    transaction.execute(
        sqlalchemy.insert(migration_table).values(
            created_at=datetime.now(tz=timezone.utc),
            version=_LATEST_SCHEMA_VERSION,
        )
    )


def _migrate_schema_0_to_1(transaction: sqlalchemy.engine.Connection) -> None:
    """Migrate the database from schema 0 to schema 1."""
    # create_all may have already added this table; checkfirst keeps this safe.
    settings_table.create(transaction, checkfirst=True)
    _seed_default_settings(transaction)


def _seed_default_settings(transaction: sqlalchemy.engine.Connection) -> None:
    """Insert default settings rows if they are missing."""
    existing = transaction.execute(
        sqlalchemy.select(settings_table.c.key).where(
            settings_table.c.key == SettingKey.LOG_LEVEL
        )
    ).first()
    if existing is not None:
        return

    transaction.execute(
        sqlalchemy.insert(settings_table).values(
            key=SettingKey.LOG_LEVEL,
            value=_DEFAULT_LOG_LEVEL,
        )
    )
