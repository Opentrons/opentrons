"""Database creation."""


from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine as create_sql_engine
from sqlalchemy.engine import Engine as SQLEngine


# TODO(mm, 2022-03-29): When we confirm we can use SQLAlchemy 1.4 on the OT-2,
# convert these to return an async engine.
# https://docs.sqlalchemy.org/en/14/orm/extensions/asyncio.html
@contextmanager
def create_in_memory_db() -> Generator[SQLEngine, None, None]:
    """Return a reference to a new, in-memory SQLite database.

    The new database is totally blank.
    You must add any required tables yourself before using it.

    Use as a context manager.
    The database and its connections will be freed when the context manager exits.
    """
    new_engine = create_in_memory_db_no_cleanup()
    try:
        yield new_engine
    finally:
        new_engine.dispose()


def create_in_memory_db_no_cleanup() -> SQLEngine:
    """Like `create_in_memory_db()`, except don't automatically clean up the database.

    Prefer `create_in_memory_db()`, in general.
    """
    return create_sql_engine(
        # Per https://docs.sqlalchemy.org/en/14/dialects/sqlite.html#connect-strings:
        #   "The sqlite :memory: identifier is the default if no filepath is present".
        # And, per https://www.sqlite.org/inmemorydb.html:
        #   "Every :memory: database is distinct from every other".
        "sqlite://",
    )
