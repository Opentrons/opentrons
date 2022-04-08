"""Data access initialization and management."""
import sqlalchemy
from sqlalchemy.engine import Engine as SQLEngine
from fastapi import Depends
import logging
from ..app_state import AppState, AppStateValue, get_app_state
from .models import metadata
from robot_server.db import open_db_no_cleanup
from pathlib import Path
from tempfile import mkdtemp
from typing_extensions import Final
from robot_server.settings import get_settings
from anyio import Path as AsyncPath

_sql_engine = AppStateValue[SQLEngine]("sql_engine")
_persistence_directory = AppStateValue[Path]("persistence_directory")
_protocol_directory = AppStateValue[Path]("protocol_directory")

_TEMP_PERSISTENCE_DIR_PREFIX: Final = "opentrons-robot-server-"
_DATABASE_FILE: Final = "robot_server.db"
_PROTOCOL_FILES_SUBDIRECTORY: Final = "protocols"

_log = logging.getLogger(__name__)

async def _get_persistence_directory(
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


async def get_protocol_directory(
    app_state: AppState = Depends(get_app_state),
    persistence_directory: Path = Depends(_get_persistence_directory),
) -> Path:
    """Get the directory to save protocol files, creating it if needed."""
    protocol_directory = _protocol_directory.get_from(app_state)

    if protocol_directory is None:
        protocol_directory = persistence_directory / _PROTOCOL_FILES_SUBDIRECTORY
        await AsyncPath(protocol_directory).mkdir(exist_ok=True)
        _protocol_directory.set_on(app_state, protocol_directory)

    return protocol_directory


def add_tables_to_db(sql_engine: sqlalchemy.engine.Engine) -> None:
    """Create the necessary database tables to back a `ProtocolStore`.

    Params:
        sql_engine: An engine for a blank SQL database, to put the tables in.
    """
    metadata.create_all(sql_engine)


def get_sql_engine(
    app_state: AppState = Depends(get_app_state),
    persistence_directory: Path = Depends(_get_persistence_directory),
) -> SQLEngine:
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
