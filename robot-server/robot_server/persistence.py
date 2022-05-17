"""Data access initialization and management."""
import logging
from datetime import datetime, timezone
from pathlib import Path
from tempfile import mkdtemp

import sqlalchemy
from anyio import Path as AsyncPath
from fastapi import Depends
from typing_extensions import Final

from robot_server.app_state import AppState, AppStateAccessor, get_app_state
from robot_server.settings import get_settings


_sql_engine_accessor = AppStateAccessor[sqlalchemy.engine.Engine]("sql_engine")
_persistence_directory_accessor = AppStateAccessor[Path]("persistence_directory")
_protocol_directory_accessor = AppStateAccessor[Path]("protocol_directory")

_TEMP_PERSISTENCE_DIR_PREFIX: Final = "opentrons-robot-server-"
_DATABASE_FILE: Final = "robot_server.db"

_log = logging.getLogger(__name__)

_metadata = sqlalchemy.MetaData()

protocol_table = sqlalchemy.Table(
    "protocol",
    _metadata,
    sqlalchemy.Column(
        "id",
        sqlalchemy.String,
        primary_key=True,
    ),
    # NOTE: This column stores naive (timezone-less) datetimes.
    # Timezones are stripped from inserted values, due to SQLite limitations.
    # To ensure proper functionality, all inserted datetimes must be UTC.
    sqlalchemy.Column(
        "created_at",
        sqlalchemy.DateTime,
        nullable=False,
    ),
    sqlalchemy.Column("protocol_key", sqlalchemy.String, nullable=True),
)

analysis_table = sqlalchemy.Table(
    "analysis",
    _metadata,
    sqlalchemy.Column(
        "id",
        sqlalchemy.String,
        primary_key=True,
    ),
    sqlalchemy.Column(
        "protocol_id",
        sqlalchemy.String,
        sqlalchemy.ForeignKey("protocol.id"),
        index=True,
        nullable=False,
    ),
    sqlalchemy.Column(
        "analyzer_version",
        sqlalchemy.String,
        nullable=False,
    ),
    sqlalchemy.Column(
        "completed_analysis",
        sqlalchemy.LargeBinary,
        nullable=False,
    ),
)

run_table = sqlalchemy.Table(
    "run",
    _metadata,
    sqlalchemy.Column(
        "id",
        sqlalchemy.String,
        primary_key=True,
    ),
    # NOTE: See above note about naive datetimes
    sqlalchemy.Column(
        "created_at",
        sqlalchemy.DateTime,
        nullable=False,
    ),
    sqlalchemy.Column(
        "protocol_id",
        sqlalchemy.String,
        sqlalchemy.ForeignKey("protocol.id"),
        nullable=True,
    ),
    sqlalchemy.Column("protocol_run_data", sqlalchemy.PickleType, nullable=True),
    sqlalchemy.Column("commands", sqlalchemy.PickleType, nullable=True),
    sqlalchemy.Column("engine_status", sqlalchemy.String, nullable=True),
    sqlalchemy.Column(
        "_updated_at",
        sqlalchemy.DateTime,
        nullable=True,
    ),
)

# TODO (tz: 4/8/22): add a column sequence_number for preserving the order of actions
action_table = sqlalchemy.Table(
    "action",
    _metadata,
    sqlalchemy.Column(
        "id",
        sqlalchemy.String,
        primary_key=True,
    ),
    # NOTE: See above note about naive datetimes
    sqlalchemy.Column("created_at", sqlalchemy.DateTime, nullable=False),
    sqlalchemy.Column("action_type", sqlalchemy.String, nullable=False),
    sqlalchemy.Column(
        "run_id",
        sqlalchemy.String,
        sqlalchemy.ForeignKey("run.id"),
        nullable=False,
    ),
)


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


def open_db_no_cleanup(db_file_path: Path) -> sqlalchemy.engine.Engine:
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


async def get_persistence_directory(
    app_state: AppState = Depends(get_app_state),
) -> Path:
    """Return the root persistence directory, creating it if necessary."""
    persistence_dir = _persistence_directory_accessor.get_from(app_state)

    if persistence_dir is None:
        setting = get_settings().persistence_directory

        if setting == "automatically_make_temporary":
            # It's bad for this blocking I/O to be in this async function,
            # but we don't have an async mkdtemp().
            persistence_dir = Path(mkdtemp(prefix=_TEMP_PERSISTENCE_DIR_PREFIX))
            _log.info(
                f"Using auto-created temporary directory {persistence_dir}"
                f" for persistence."
            )
        else:
            persistence_dir = setting
            await AsyncPath(persistence_dir).mkdir(parents=True, exist_ok=True)
            _log.info(f"Using directory {persistence_dir} for persistence.")

        _persistence_directory_accessor.set_on(app_state, persistence_dir)

    return persistence_dir


def add_tables_to_db(sql_engine: sqlalchemy.engine.Engine) -> None:
    """Create the necessary database tables to back all data stores.

    Params:
        sql_engine: An engine for a blank SQL database, to put the tables in.
    """
    _metadata.create_all(sql_engine)


def get_sql_engine(
    app_state: AppState = Depends(get_app_state),
    persistence_directory: Path = Depends(get_persistence_directory),
) -> sqlalchemy.engine.Engine:
    """Return a singleton SQL engine referring to a ready-to-use database."""
    sql_engine = _sql_engine_accessor.get_from(app_state)

    if sql_engine is None:
        sql_engine = open_db_no_cleanup(
            db_file_path=persistence_directory / _DATABASE_FILE
        )
        add_tables_to_db(sql_engine)
        _sql_engine_accessor.set_on(app_state, sql_engine)

    return sql_engine
    # Rely on connections being cleaned up automatically when the process dies.
    # FastAPI doesn't give us a convenient way to properly tie
    # the lifetime of a dependency to the lifetime of the server app.
    # https://github.com/tiangolo/fastapi/issues/617


def ensure_utc_datetime(dt: object) -> datetime:
    """Ensure an object is a TZ-aware UTC datetime.

    Args:
        dt: A UTC-coded datetime to be insterted into the database,
            or a naive (timezone-less) datetime pulled from the database.

    Returns:
        A datetime with its timezone set to UTC.
    """
    assert isinstance(dt, datetime), f"{dt} is not a datetime"

    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    else:
        assert dt.tzinfo == timezone.utc, f"Expected '{dt}' to be UTC"
        return dt
