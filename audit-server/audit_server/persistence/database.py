"""SQLite database initialization and utilities."""

from __future__ import annotations

from contextlib import contextmanager
from pathlib import Path
from typing import Generator

import sqlalchemy

from server_utils import sql_utils

from audit_server.persistence import orm_models


@contextmanager
def sql_engine_ctx(
    db_path: Path,
) -> Generator[sqlalchemy.engine.Engine, None, None]:
    """Context-managed engine that disposes itself on exit.

    Configures the underlying ``sqlite3`` (pysqlite) connections to:

    * enforce foreign-key constraints,
    * use sane, transactional DDL semantics, and
    * use write-ahead logging (WAL) for the database journal.
    """
    engine = sqlalchemy.create_engine(sql_utils.get_connection_url(db_path))
    try:
        sql_utils.enable_foreign_key_constraints(engine)
        sql_utils.fix_transactions(engine)
        sql_utils.enable_write_ahead_logging(engine)
        yield engine
    finally:
        engine.dispose()


def create_schema(engine: sqlalchemy.engine.Engine) -> None:
    """Create all ORM-mapped tables that don't yet exist."""
    orm_models.Base.metadata.create_all(engine)
