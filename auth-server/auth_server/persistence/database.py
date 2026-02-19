"""SQLite database initialization and utilities."""

from __future__ import annotations

from contextlib import contextmanager
from pathlib import Path
from typing import Generator

import sqlalchemy
from sqlalchemy.orm import DeclarativeBase

from server_utils import sql_utils


class Base(DeclarativeBase):
    """Base class for all ORM models."""


def create_sql_engine(
    db_path: Path,
) -> sqlalchemy.engine.Engine:
    """Create a SQLAlchemy engine.

    Prefer ``sql_engine_ctx`` so the engine is disposed automatically.

    Args:
        db_path: Path to a SQLite file.
    """
    engine = sqlalchemy.create_engine(
        sql_utils.get_connection_url(db_path),
    )
    try:
        sql_utils.enable_foreign_key_constraints(engine)
        sql_utils.fix_transactions(engine)
    except Exception:
        engine.dispose()
        raise
    return engine


@contextmanager
def sql_engine_ctx(
    db_path: Path | None = None,
) -> Generator[sqlalchemy.engine.Engine, None, None]:
    """Context-managed engine that disposes itself on exit."""
    engine = create_sql_engine(db_path)
    try:
        yield engine
    finally:
        engine.dispose()


def create_schema(engine: sqlalchemy.engine.Engine) -> None:
    """Create all ORM-mapped tables that don't yet exist."""
    Base.metadata.create_all(engine)
