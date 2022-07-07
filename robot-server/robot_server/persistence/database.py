"""SQLite database initialization and utilities."""
from pathlib import Path

import sqlalchemy

from .tables import add_tables_to_db
from .migrations import migrate


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
    """Create a SQL engine with tables and migrations."""
    sql_engine = _open_db_no_cleanup(db_file_path=path)

    try:
        add_tables_to_db(sql_engine)
        migrate(sql_engine)
    except Exception:
        sql_engine.dispose()
        raise

    return sql_engine


def _open_db_no_cleanup(db_file_path: Path) -> sqlalchemy.engine.Engine:
    """Create a database engine for performing transactions."""
    engine = sqlalchemy.create_engine(
        # sqlite://<hostname>/<path>
        # where <hostname> is empty.
        f"sqlite:///{db_file_path}",
    )

    # Enable foreign key support in sqlite
    # https://docs.sqlalchemy.org/en/14/dialects/sqlite.html#foreign-key-support
    @sqlalchemy.event.listens_for(engine, "connect")  # type: ignore[misc]
    def _set_sqlite_pragma(
        dbapi_connection: sqlalchemy.engine.CursorResult,
        connection_record: sqlalchemy.engine.CursorResult,
    ) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON;")
        cursor.close()

    return engine
