"""Utilities for working with SQLite databases through SQLAlchemy."""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, TypeAlias

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

    @sqlalchemy.event.listens_for(engine, "connect")  # type: ignore[untyped-decorator]
    def on_connect(
        # TODO(mm, 2023-08-29): Improve these type annotations when we have SQLAlchemy 2.0.
        dbapi_connection: Any,
        connection_record: object,
    ) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON;")
        cursor.close()


def enable_write_ahead_logging(engine: sqlalchemy.engine.Engine) -> None:
    """Switch the SQLite database into write-ahead logging (WAL) journal mode.

    WAL improves concurrency by letting readers run alongside a single writer,
    and survives across processes since the journal mode is persisted in the
    database file itself.

    This should be called once per SQLAlchemy engine, shortly after creating it,
    before doing anything substantial with it.

    Params:
        engine: A SQLAlchemy engine connected to a SQLite database, backed by
            Python's built-in ``sqlite3`` module (pysqlite).
    """
    # The journal mode is persisted in the database header, so this only needs
    # to take effect once per database file. We still listen on every connect
    # so that fresh database files (e.g. just created by Alembic) get switched
    # over to WAL the first time we touch them.

    @sqlalchemy.event.listens_for(engine, "connect")  # type: ignore[untyped-decorator]
    def on_connect(
        dbapi_connection: Any,
        connection_record: object,
    ) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL;")
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

    @sqlalchemy.event.listens_for(engine, "connect")  # type: ignore[untyped-decorator]
    def on_connect(
        # TODO(mm, 2023-08-29): Improve these type annotations when we have SQLAlchemy 2.0.
        dbapi_connection: Any,
        connection_record: object,
    ) -> None:
        # disable pysqlite's emitting of the BEGIN statement entirely.
        # also stops it from emitting COMMIT before any DDL.
        dbapi_connection.isolation_level = None

    @sqlalchemy.event.listens_for(engine, "begin")  # type: ignore[untyped-decorator]
    def on_begin(conn: sqlalchemy.engine.Connection) -> None:
        # emit our own BEGIN
        conn.exec_driver_sql("BEGIN")


class UTCDateTime(sqlalchemy.types.TypeDecorator[datetime]):
    """A SQL column type to store UTC datetimes.

    Usage example:

        table = sqlalchemy.Table(
            ...
            sqlalchemy.Column("my_datetime_column", UTCDateTime)
        )

    Opentrons server code should always use this instead of SQLAlchemy's
    built-in DateTime type.

    Motivation:

    We generally want our datetimes to have a UTC timezone so they're unambiguous.
    Unfortunately, when we use SQLAlchemy's built-in DateTime type with SQLite,
    the timezone gets stripped upon insertion, and subsequent reads return a naive
    (timezone-less) datetime.

    Using this class instead preserves datetimes' UTC-ness.

    * When a Python datetime object gets inserted into SQL:

      This first asserts that the Python object has its timezone set to UTC,
      because we don't currently have any good reason try to store non-UTC datetimes.

      Then, it inserts the timestamp into the database without any explicit timezone.
      This matches how sqlalchemy.DateTime would store it.

    * When a datetime is extracted from SQL:

      The raw timestamp from the database will be naive (timezone-less).
      This marks it with the UTC timezone before returning it.
    """

    impl = sqlalchemy.types.DateTime
    cache_ok = True

    def process_bind_param(
        self, value: datetime | None, dialect: object
    ) -> datetime | None:
        """Prepare a Python datetime object to inserted into SQL via SQLAlchemy."""
        if value is not None:
            assert value.tzinfo == timezone.utc, f"Expected '{value}' to be UTC"

        # Pass the value to sqlalchemy.DateTime,
        # which will strip .tzinfo and store the timestamp as-is.
        return value

    def process_result_value(
        self, value: datetime | None, dialect: object
    ) -> datetime | None:
        """Process a Python datetime object that SQLAlchemy just extracted from SQL."""
        if value is not None:
            assert value.tzinfo is None
            return value.replace(tzinfo=timezone.utc)
        return None


JsonPythonValue: TypeAlias = (
    str
    | int
    | float
    | bool
    | None
    | list["JsonPythonValue"]
    | dict[str, "JsonPythonValue"]
)
"""The output of `json.dumps()` / the input of `json.loads()`."""


class JsonValue(sqlalchemy.TypeDecorator[object]):
    """Transparently serializes Python values to/from JSON strings in the DB.

    Requires the use of the sqlalchemy ORM layer; set a column type to this
    to automatically write any serializable value to it:

    column_name: Mapped[JsonPythonValue] = mapped_column(JsonValue, ...)
    """

    impl = sqlalchemy.String
    cache_ok = True

    def process_bind_param(self, value: object | None, dialect: Any) -> str | None:
        """Python → DB: json.dumps before writing."""
        return json.dumps(value)

    def process_result_value(self, value: str | None, dialect: Any) -> object | None:
        """DB → Python: json.loads after reading."""
        if value is not None:
            result: object = json.loads(value)
            return result
        return None
