"""SQLite database migrations.

Adding new tables to the database is handled transparently
by SQLAlchemy. This simple migrations module exists to
allow us to modify existing tables when we need to.

- Add new, nullable columns
- Add new, non-nullable columns with default values
- Delete columns (possible, but ill-advised)
- Drop tables (possible, but ill-advised)

Database schema versions:

- Version 0
    - Initial schema version
"""
import logging
from datetime import datetime, timezone
from typing import Optional
from typing_extensions import Final

import sqlalchemy

from .tables import migration_table

_LATEST_SCHEMA_VERSION: Final = 0

_log = logging.getLogger(__name__)


def migrate(sql_engine: sqlalchemy.engine.Engine) -> None:
    """Migrate the database to the latest schema version.

    SQLAlchemy will transparently add missing tables, so
    migrations are only needed when columns are added to
    existing tables.

    NOTE: added columns should be nullable.
    """
    with sql_engine.begin() as transaction:
        version = _get_schema_version(transaction)
        if version != _LATEST_SCHEMA_VERSION:
            _log.info(
                f"Marking fresh database as schema version {_LATEST_SCHEMA_VERSION}"
            )
            _mark_latest_revision(transaction)


def _get_schema_version(transaction: sqlalchemy.engine.Connection) -> Optional[int]:
    """Get the starting version of the database.

    Returns:
        The version found, or None if this is a fresh database that
            the migration system has not yet marked.
    """
    select_latest_version = sqlalchemy.select(migration_table).order_by(
        sqlalchemy.desc(migration_table.c.version)
    )
    migration = transaction.execute(select_latest_version).first()

    return migration["version"] if migration is not None else None


def _mark_latest_revision(transaction: sqlalchemy.engine.Connection) -> None:
    """Given an empty migration table, mark version 0.

    When the migration is created, it is empty. Given that the current
    schema version is the initial version 0, we simply mark the current
    version by adding an entry to the migration table.
    """
    transaction.execute(
        sqlalchemy.insert(migration_table).values(
            created_at=datetime.now(tz=timezone.utc),
            version=_LATEST_SCHEMA_VERSION,
        )
    )
