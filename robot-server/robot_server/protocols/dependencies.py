"""FastAPI dependencies for protocol endpoints."""


import logging
from pathlib import Path
from tempfile import gettempdir
from typing_extensions import Final

from anyio import Path as AsyncPath
from fastapi import Depends

from opentrons.protocol_reader import ProtocolReader
from opentrons.protocol_runner import create_simulating_runner

from robot_server.app_state import AppState, AppStateValue, get_app_state
from robot_server.db import open_db_no_cleanup
from robot_server.settings import get_settings

from .protocol_store import (
    ProtocolStore,
    add_tables_to_db as add_protocol_store_tables_to_db,
)
from .protocol_analyzer import ProtocolAnalyzer
from .analysis_store import AnalysisStore

from sqlalchemy.engine import Engine as SQLEngine


# Relative to our root persistence directory.
_PROTOCOL_FILES_SUBDIRECTORY: Final[str] = "protocols"
_DATABASE_FILE: Final[str] = "robot_server.db"


_log = logging.getLogger(__name__)

_sql_engine = AppStateValue[SQLEngine]("sql_engine")
_persistence_directory = AppStateValue[Path]("persistence_directory")
_protocol_directory = AppStateValue[Path]("protocol_directory")
_protocol_store = AppStateValue[ProtocolStore]("protocol_store")
_analysis_store = AppStateValue[AnalysisStore]("analysis_store")


async def _get_persistence_directory(
    app_state: AppState = Depends(get_app_state),
) -> Path:
    """Return the root persistence directory, creating it if necessary."""
    persistence_dir = _persistence_directory.get_from(app_state)

    if persistence_dir is None:
        setting = get_settings().persistence_directory

        if setting == "automatically_make_temporary":
            # It's bad for this blocking I/O to be in this async function,
            # but we don't have an async gettempdir().
            persistence_dir = Path(gettempdir())
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


def _get_sql_engine(
    app_state: AppState = Depends(get_app_state),
    persistence_directory: Path = Depends(_get_persistence_directory),
) -> SQLEngine:
    sql_engine = _sql_engine.get_from(app_state)

    if sql_engine is None:
        sql_engine = open_db_no_cleanup(
            db_file_path=persistence_directory / _DATABASE_FILE
        )
        add_protocol_store_tables_to_db(sql_engine)
        _sql_engine.set_on(app_state, sql_engine)

    return sql_engine
    # Rely on connections being cleaned up automatically when the process dies.
    # FastAPI doesn't give us a convenient way to properly tie
    # the lifetime of a dependency to the lifetime of the server app.
    # https://github.com/tiangolo/fastapi/issues/617


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


def get_protocol_reader() -> ProtocolReader:
    """Get a ProtocolReader to read and save uploaded protocol files."""
    return ProtocolReader()


def get_protocol_store(
    app_state: AppState = Depends(get_app_state),
    sql_engine: SQLEngine = Depends(_get_sql_engine),
) -> ProtocolStore:
    """Get a singleton ProtocolStore to keep track of created protocols."""
    protocol_store = _protocol_store.get_from(app_state)

    if protocol_store is None:
        protocol_store = ProtocolStore(sql_engine=sql_engine)
        _protocol_store.set_on(app_state, protocol_store)

    return protocol_store


def get_analysis_store(app_state: AppState = Depends(get_app_state)) -> AnalysisStore:
    """Get a singleton AnalysisStore to keep track of created analyses."""
    analysis_store = _analysis_store.get_from(app_state)

    if analysis_store is None:
        analysis_store = AnalysisStore()
        _analysis_store.set_on(app_state, analysis_store)

    return analysis_store


async def get_protocol_analyzer(
    analysis_store: AnalysisStore = Depends(get_analysis_store),
) -> ProtocolAnalyzer:
    """Construct a ProtocolAnalyzer for a single request."""
    protocol_runner = await create_simulating_runner()

    return ProtocolAnalyzer(
        protocol_runner=protocol_runner,
        analysis_store=analysis_store,
    )
