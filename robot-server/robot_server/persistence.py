"""Data access initialization and management."""
import sqlalchemy
from sqlalchemy.engine import Engine as SQLEngine
from sqlalchemy import create_engine
from fastapi import Depends
from sqlalchemy import event

import logging

from pathlib import Path
from tempfile import mkdtemp
from typing_extensions import Final
from anyio import Path as AsyncPath

from robot_server.app_state import AppState, AppStateValue, get_app_state
from robot_server.settings import get_settings

_sql_engine = AppStateValue[SQLEngine]("sql_engine")
_persistence_directory = AppStateValue[Path]("persistence_directory")
_protocol_directory = AppStateValue[Path]("protocol_directory")

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
    sqlalchemy.Column(
        "created_at",
        sqlalchemy.DateTime,
        nullable=False,
    ),
    # TODO(mm, 2022-03-29):
    # Storing pickled Python objects, especially of an internal class,
    # will cause migration and compatibility problems.
    sqlalchemy.Column(
        "source",
        sqlalchemy.PickleType,
        nullable=False,
    ),
    sqlalchemy.Column("protocol_key", sqlalchemy.String, nullable=True),
)

run_table = sqlalchemy.Table(
    "run",
    _metadata,
    sqlalchemy.Column(
        "id",
        sqlalchemy.String,
        primary_key=True,
    ),
    sqlalchemy.Column(
        "created_at",
        sqlalchemy.DateTime,
        nullable=False,
    ),
    sqlalchemy.Column(
        "protocol_id",
        sqlalchemy.String,
        sqlalchemy.ForeignKey("protocol.id"),
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
    sqlalchemy.Column("created_at", sqlalchemy.DateTime, nullable=False),
    sqlalchemy.Column("action_type", sqlalchemy.String, nullable=False),
    sqlalchemy.Column(
        "run_id",
        sqlalchemy.String,
        sqlalchemy.ForeignKey("run.id"),
        nullable=False,
    ),
)


# Enable foreign key support in sqlite
# https://docs.sqlalchemy.org/en/14/dialects/sqlite.html#foreign-key-support
@event.listens_for(SQLEngine, "connect")
def _set_sqlite_pragma(dbapi_connection: sqlalchemy.engine.Connection, connection_record: sqlalchemy.engine.CursorResult) -> None:
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON;")
    cursor.close()


def open_db_no_cleanup(db_file_path: Path) -> SQLEngine:
    """Create a database engine for performing transactions."""
    return create_engine(
        # sqlite://<hostname>/<path>
        # where <hostname> is empty.
        f"sqlite:///{db_file_path}",
    )


async def get_persistence_directory(
        app_state: AppState = Depends(get_app_state),
) -> Path:
    """Return the root persistence directory, creating it if necessary."""
    persistence_dir = _persistence_directory.get_from(app_state)

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

        _persistence_directory.set_on(app_state, persistence_dir)

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
) -> SQLEngine:
    """Return a singleton SQL engine referring to a ready-to-use database."""
    sql_engine = _sql_engine.get_from(app_state)

    if sql_engine is None:
        sql_engine = open_db_no_cleanup(
            db_file_path=persistence_directory / _DATABASE_FILE
        )
        add_tables_to_db(sql_engine)
        _sql_engine.set_on(app_state, sql_engine)

    return sql_engine
    # Rely on connections being cleaned up automatically when the process dies.
    # FastAPI doesn't give us a convenient way to properly tie
    # the lifetime of a dependency to the lifetime of the server app.
    # https://github.com/tiangolo/fastapi/issues/617
