"""FastAPI dependencies for protocol endpoints."""


from asyncio import Lock as AsyncLock
from pathlib import Path
from typing_extensions import Final
import logging

from anyio import Path as AsyncPath
from fastapi import Depends
from sqlalchemy.engine import Engine as SQLEngine

from opentrons.protocol_reader import ProtocolReader, FileReaderWriter, FileHasher

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)
from robot_server.deletion_planner import ProtocolDeletionPlanner
from robot_server.persistence import get_sql_engine, get_active_persistence_directory
from robot_server.settings import get_settings

from .protocol_auto_deleter import ProtocolAutoDeleter
from .protocol_store import (
    ProtocolStore,
)
from .protocol_analyzer import ProtocolAnalyzer
from .analysis_store import AnalysisStore


_PROTOCOL_FILES_SUBDIRECTORY: Final = "protocols"

_log = logging.getLogger(__name__)

_protocol_store_init_lock = AsyncLock()
_protocol_store_accessor = AppStateAccessor[ProtocolStore]("protocol_store")

_analysis_store_accessor = AppStateAccessor[AnalysisStore]("analysis_store")

_protocol_directory_init_lock = AsyncLock()
_protocol_directory_accessor = AppStateAccessor[Path]("protocol_directory")


def get_protocol_reader() -> ProtocolReader:
    """Get a ProtocolReader to read and save uploaded protocol files."""
    return ProtocolReader()


def get_file_reader_writer() -> FileReaderWriter:
    """Get a FileReaderWriter to read file streams into memory and write file streams to disk."""
    return FileReaderWriter()


def get_file_hasher() -> FileHasher:
    """Get a FileHasher to hash a file and see if it already exists on the server."""
    return FileHasher()


async def get_protocol_directory(
    app_state: AppState = Depends(get_app_state),
    persistence_directory: Path = Depends(get_active_persistence_directory),
) -> Path:
    """Get the directory to save protocol files, creating it if needed."""
    async with _protocol_directory_init_lock:
        protocol_directory = _protocol_directory_accessor.get_from(app_state)
        if protocol_directory is None:
            protocol_directory = persistence_directory / _PROTOCOL_FILES_SUBDIRECTORY
            await AsyncPath(protocol_directory).mkdir(exist_ok=True)
            _protocol_directory_accessor.set_on(app_state, protocol_directory)

        return protocol_directory


async def get_protocol_store(
    app_state: AppState = Depends(get_app_state),
    sql_engine: SQLEngine = Depends(get_sql_engine),
    protocol_directory: Path = Depends(get_protocol_directory),
    protocol_reader: ProtocolReader = Depends(get_protocol_reader),
) -> ProtocolStore:
    """Get a singleton ProtocolStore to keep track of created protocols."""
    async with _protocol_store_init_lock:
        protocol_store = _protocol_store_accessor.get_from(app_state)
        if protocol_store is None:
            protocol_store = await ProtocolStore.rehydrate(
                sql_engine=sql_engine,
                protocols_directory=protocol_directory,
                protocol_reader=protocol_reader,
            )
            _protocol_store_accessor.set_on(app_state, protocol_store)

        return protocol_store


async def get_analysis_store(
    app_state: AppState = Depends(get_app_state),
    sql_engine: SQLEngine = Depends(get_sql_engine),
) -> AnalysisStore:
    """Get a singleton AnalysisStore to keep track of created analyses."""
    analysis_store = _analysis_store_accessor.get_from(app_state)

    if analysis_store is None:
        analysis_store = AnalysisStore(sql_engine=sql_engine)
        _analysis_store_accessor.set_on(app_state, analysis_store)

    return analysis_store


async def get_protocol_analyzer(
    analysis_store: AnalysisStore = Depends(get_analysis_store),
) -> ProtocolAnalyzer:
    """Construct a ProtocolAnalyzer for a single request."""
    return ProtocolAnalyzer(
        analysis_store=analysis_store,
    )


async def get_protocol_auto_deleter(
    protocol_store: ProtocolStore = Depends(get_protocol_store),
) -> ProtocolAutoDeleter:
    """Get a `ProtocolAutoDeleter` to delete old protocols."""
    return ProtocolAutoDeleter(
        protocol_store=protocol_store,
        deletion_planner=ProtocolDeletionPlanner(
            maximum_unused_protocols=get_settings().maximum_unused_protocols
        ),
    )
