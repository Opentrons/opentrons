"""SQLite database initialization and utilities."""

from __future__ import annotations

from contextlib import contextmanager
from pathlib import Path
from typing import Generator

import sqlalchemy
from sqlalchemy.orm import declarative_base

from server_utils import sql_utils

Base = declarative_base()


@contextmanager
def sql_engine_ctx(
    db_path: Path,
) -> Generator[sqlalchemy.engine.Engine, None, None]:
    """Context-managed engine that disposes itself on exit."""
    engine = sqlalchemy.create_engine(
        sql_utils.get_connection_url(db_path),
        future=True,
    )
    try:
        sql_utils.enable_foreign_key_constraints(engine)
        sql_utils.fix_transactions(engine)
        yield engine
    finally:
        engine.dispose()


def create_schema(engine: sqlalchemy.engine.Engine) -> None:
    """Create all ORM-mapped tables that don't yet exist."""
    # we need to import the User model to ensure it is created in the database
    from auth_server.persistence.orm_models import User  # noqa: F401
    from auth_server.persistence.orm_models import Settings  # noqa: F401 
    # create all tables
    Base.metadata.create_all(engine)
