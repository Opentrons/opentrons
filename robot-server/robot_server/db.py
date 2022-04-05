"""Database creation."""


from contextlib import contextmanager
from pathlib import Path
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine as SQLEngine


# TODO(mm, 2022-03-29): When we confirm we can use SQLAlchemy 1.4 on the OT-2,
# convert these to return an async engine.
# https://docs.sqlalchemy.org/en/14/orm/extensions/asyncio.html
@contextmanager
def opened_db(db_file_path: Path) -> Generator[SQLEngine, None, None]:
    """Return an Engine for a SQLite database on hte filesystem.

    Clean up the engine when the context manager exits.

    The new database will be totally blank--no tables.
    """
    sql_engine = open_db_no_cleanup(db_file_path=db_file_path)
    try:
        yield sql_engine
    finally:
        sql_engine.dispose()


def open_db_no_cleanup(db_file_path: Path) -> SQLEngine:
    """Like `create_in_memory_db()`, except without automatic cleanup."""
    return create_engine(
        # sqlite://<hostname>/<path>
        # where <hostname> is empty.
        f"sqlite:///{db_file_path}",
    )
