"""Database creation."""


from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine as SQLEngine
from sqlalchemy.pool import StaticPool


# TODO(mm, 2022-03-29): When we confirm we can use SQLAlchemy 1.4 on the OT-2,
# convert these to return an async engine.
# https://docs.sqlalchemy.org/en/14/orm/extensions/asyncio.html
@contextmanager
def create_in_memory_db() -> Generator[SQLEngine, None, None]:
    """Return an Engine for a new in-memory SQLite database.

    Clean up the database and its connections when the context manager exits.

    Different threads may open connections through the returned `Engine`.
    They will connect to the same underlying database.

    The new database will be totally blank--no tables.
    """
    new_engine = create_in_memory_db_no_cleanup()
    try:
        yield new_engine
    finally:
        new_engine.dispose()


def create_in_memory_db_no_cleanup() -> SQLEngine:
    """Like `create_in_memory_db()`, except without automatic cleanup."""
    # fmt: off
    return create_engine(
        # Per https://docs.sqlalchemy.org/en/14/dialects/sqlite.html#connect-strings:
        #   "The sqlite :memory: identifier is the default if no filepath is present".
        # And, per https://www.sqlite.org/inmemorydb.html:
        #   "Every :memory: database is distinct from every other".
        "sqlite://",

        # Trickery endorsed by docs.sqlalchemy.org/en/14/dialects/sqlite.html:

        # The default, SingletonThreadPool, gives each accessing thread
        # its own dedicated connection. This would cause problems for us.
        # Because SQLite in-memory databases are connection-specific,
        # each thread that connects through this Engine would access a different
        # database. But we want them to all hit the same one.
        #
        # Using StaticPool fixes this by funneling everything through
        # a single connection.
        poolclass=StaticPool,

        # pysqlite, which SQLAlchemy uses internally,
        # apparently blocks us from sharing the single static connection
        # across multiple threads for obsolete reasons.
        # Disable this enforcement.
        connect_args={'check_same_thread': False}
    )
    # fmt: on
