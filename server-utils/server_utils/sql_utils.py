"""Utilities for working with SQLite databases through SQLAlchemy."""

from pathlib import Path
from typing import Any

import sqlalchemy


def get_connection_url(db_file_path: Path) -> str:
    """Return a connection URL to pass to `sqlalchemy.create_engine()`.

    Params:
        db_file_path: The path to the SQLite database file to open.
        (This file often has an extension like .db, .sqlite, or .sqlite3.)
    """
    # sqlite://<hostname>/<path>
    # where <hostname> is empty.
    return f"sqlite:///{db_file_path}"


def enable_foreign_key_constraints(engine: sqlalchemy.engine.Engine) -> None:
    """Enable SQLite's enforcement of foreign key constraints.

    SQLite does not enforce foreign key constraints by default, for backwards compatibility.

    This should be called once per SQLAlchemy engine, shortly after creating it,
    before doing anything substantial with it.

    Params:
        engine: A SQLAlchemy engine connected to a SQLite database.
    """
    # Copied from:
    # https://docs.sqlalchemy.org/en/14/dialects/sqlite.html#foreign-key-support

    @sqlalchemy.event.listens_for(engine, "connect")  # type: ignore[misc]
    def on_connect(
        # TODO(mm, 2023-08-29): Improve these type annotations when we have SQLAlchemy 2.0.
        dbapi_connection: Any,
        connection_record: object,
    ) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON;")
        cursor.close()


def fix_transactions(engine: sqlalchemy.engine.Engine) -> None:
    """Make SQLite transactions behave sanely.

    This works around various misbehaviors in Python's `sqlite3` driver (aka `pysqlite`),
    which is a middle layer between SQLAlchemy and the underlying SQLite library.
    These misbehaviors can make transactions not actually behave transactionally. See:
    https://docs.sqlalchemy.org/en/14/dialects/sqlite.html#serializable-isolation-savepoints-transactional-ddl

    This should be called once per SQLAlchemy engine, shortly after creating it,
    before doing anything substantial with it.

    Params:
        engine: A SQLAlchemy engine connected to a SQLite database.
    """
    # Copied from:
    # https://docs.sqlalchemy.org/en/14/dialects/sqlite.html#serializable-isolation-savepoints-transactional-ddl.

    @sqlalchemy.event.listens_for(engine, "connect")  # type: ignore[misc]
    def on_connect(
        # TODO(mm, 2023-08-29): Improve these type annotations when we have SQLAlchemy 2.0.
        dbapi_connection: Any,
        connection_record: object,
    ) -> None:
        # disable pysqlite's emitting of the BEGIN statement entirely.
        # also stops it from emitting COMMIT before any DDL.
        dbapi_connection.isolation_level = None

    @sqlalchemy.event.listens_for(engine, "begin")  # type: ignore[misc]
    def on_begin(conn: sqlalchemy.engine.Connection) -> None:
        # emit our own BEGIN
        conn.exec_driver_sql("BEGIN")
