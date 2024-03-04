"""SQLite database initialization and utilities."""
from contextlib import contextmanager
from pathlib import Path
from typing import Generator

import sqlalchemy

from server_utils import sql_utils


# A reference to SQLite's built-in ROWID column.
#
# https://www.sqlite.org/autoinc.html
#
# ROWID is basically an autoincrementing integer, implicitly present in every table.
# It's useful for selecting rows in the order we originally inserted them.
# For example:
#
#     sqlalchemy.select(my_table).order_by(sqlite_row_id)
#
# Note that without an explicit .order_by() clause,
# a .select() call will return results in an undefined order.
sqlite_rowid = sqlalchemy.column("_ROWID_")


def create_sql_engine(path: Path) -> sqlalchemy.engine.Engine:
    """Return an engine for accessing the given SQLite database file.

    If the file does not already exist, it will be created, empty.
    You must separately set up any tables you're expecting.
    """
    sql_engine = sqlalchemy.create_engine(sql_utils.get_connection_url(path))

    try:
        sql_utils.enable_foreign_key_constraints(sql_engine)
        sql_utils.fix_transactions(sql_engine)

    except Exception:
        sql_engine.dispose()
        raise

    return sql_engine


@contextmanager
def sql_engine_ctx(path: Path) -> Generator[sqlalchemy.engine.Engine, None, None]:
    """Like `create_sql_engine()`, but clean up when done."""
    engine = create_sql_engine(path)
    try:
        yield engine
    finally:
        engine.dispose()
