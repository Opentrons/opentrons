"""SQLite database initialization and utilities."""
from pathlib import Path

import sqlalchemy

from server_utils import sql_utils

from ._tables import schema_2, schema_3
from ._migrations.up_to_2 import migrate


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


def create_schema_2_sql_engine(path: Path) -> sqlalchemy.engine.Engine:
    """Create a SQL engine for a schema 2 database.

    If provided a schema 0 or 1 database, this will migrate it in-place to schema 2.

    Warning:
        Migrations can take several minutes. If calling this from an async function,
        offload this to a thread to avoid blocking the event loop.
    """
    sql_engine = sqlalchemy.create_engine(sql_utils.get_connection_url(path))

    try:
        sql_utils.enable_foreign_key_constraints(sql_engine)
        sql_utils.fix_transactions(sql_engine)
        schema_2.metadata.create_all(sql_engine)

        migrate(sql_engine)

    except Exception:
        sql_engine.dispose()
        raise

    return sql_engine


def create_schema_3_sql_engine(path: Path) -> sqlalchemy.engine.Engine:
    """Create a SQL engine for a schema 3 database.

    Unlike `create_schema_2_sql_engine()`, this assumes the database is already
    at schema 3. Migration is done through other mechanisms.
    """
    sql_engine = sqlalchemy.create_engine(sql_utils.get_connection_url(path))

    try:
        sql_utils.enable_foreign_key_constraints(sql_engine)
        sql_utils.fix_transactions(sql_engine)
        schema_3.metadata.create_all(sql_engine)

    except Exception:
        sql_engine.dispose()
        raise

    return sql_engine
