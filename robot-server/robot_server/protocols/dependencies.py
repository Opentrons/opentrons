"""FastAPI dependencies for protocol endpoints."""


from asyncio import Lock as AsyncLock
from pathlib import Path
from typing_extensions import Annotated

from anyio import Path as AsyncPath
from fastapi import Depends
from robot_server.protocols.protocol_models import ProtocolKind
from sqlalchemy.engine import Engine as SQLEngine

from opentrons.protocol_reader import ProtocolReader, FileReaderWriter, FileHasher

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)
from robot_server.service.task_runner import TaskRunner, get_task_runner
from robot_server.deletion_planner import ProtocolDeletionPlanner
from robot_server.persistence.fastapi_dependencies import (
    get_sql_engine,
    get_active_persistence_directory,
)
from robot_server.persistence.file_and_directory_names import PROTOCOLS_DIRECTORY
from robot_server.settings import get_settings
from .analyses_manager import AnalysesManager

from .protocol_auto_deleter import ProtocolAutoDeleter
from .protocol_store import (
    ProtocolStore,
)
from .analysis_store import AnalysisStore


_protocol_store_init_lock = AsyncLock()
_protocol_store_accessor = AppStateAccessor[ProtocolStore]("protocol_store")

_analysis_store_accessor = AppStateAccessor[AnalysisStore]("analysis_store")

_analyses_manager_accessor = AppStateAccessor[AnalysesManager]("analyses_manager")
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
    app_state: Annotated[AppState, Depends(get_app_state)],
    persistence_directory: Annotated[Path, Depends(get_active_persistence_directory)],
) -> Path:
    """Get the directory to save protocol files, creating it if needed."""
    async with _protocol_directory_init_lock:
        protocol_directory = _protocol_directory_accessor.get_from(app_state)
        if protocol_directory is None:
            protocol_directory = persistence_directory / PROTOCOLS_DIRECTORY
            await AsyncPath(protocol_directory).mkdir(exist_ok=True)
            _protocol_directory_accessor.set_on(app_state, protocol_directory)

        return protocol_directory


async def get_protocol_store(
    app_state: Annotated[AppState, Depends(get_app_state)],
    sql_engine: Annotated[SQLEngine, Depends(get_sql_engine)],
    protocol_directory: Annotated[Path, Depends(get_protocol_directory)],
    protocol_reader: Annotated[ProtocolReader, Depends(get_protocol_reader)],
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
    app_state: Annotated[AppState, Depends(get_app_state)],
    sql_engine: Annotated[SQLEngine, Depends(get_sql_engine)],
) -> AnalysisStore:
    """Get a singleton AnalysisStore to keep track of created analyses."""
    analysis_store = _analysis_store_accessor.get_from(app_state)

    if analysis_store is None:
        analysis_store = AnalysisStore(sql_engine=sql_engine)
        _analysis_store_accessor.set_on(app_state, analysis_store)

    return analysis_store


async def get_analyses_manager(
    app_state: Annotated[AppState, Depends(get_app_state)],
    analysis_store: Annotated[AnalysisStore, Depends(get_analysis_store)],
    task_runner: Annotated[TaskRunner, Depends(get_task_runner)],
) -> AnalysesManager:
    """Get a singleton AnalysesManager to keep track of analyzers."""
    analyses_manager = _analyses_manager_accessor.get_from(app_state)

    if analyses_manager is None:
        analyses_manager = AnalysesManager(
            analysis_store=analysis_store, task_runner=task_runner
        )
        _analyses_manager_accessor.set_on(app_state, analyses_manager)

    return analyses_manager


async def get_protocol_auto_deleter(
    protocol_store: Annotated[ProtocolStore, Depends(get_protocol_store)],
) -> ProtocolAutoDeleter:
    """Get a `ProtocolAutoDeleter` to delete old protocols."""
    return ProtocolAutoDeleter(
        protocol_store=protocol_store,
        deletion_planner=ProtocolDeletionPlanner(
            maximum_unused_protocols=get_settings().maximum_unused_protocols
        ),
        protocol_kind=ProtocolKind.STANDARD,
    )


async def get_quick_transfer_protocol_auto_deleter(
    protocol_store: Annotated[ProtocolStore, Depends(get_protocol_store)],
) -> ProtocolAutoDeleter:
    """Get a `ProtocolAutoDeleter` to delete old quick transfer protocols."""
    return ProtocolAutoDeleter(
        protocol_store=protocol_store,
        deletion_planner=ProtocolDeletionPlanner(
            maximum_unused_protocols=get_settings().maximum_quick_transfer_protocols
        ),
        protocol_kind=ProtocolKind.QUICK_TRANSFER,
    )


def get_maximum_quick_transfer_protocols() -> int:
    """Get the maximum quick transfer protocol setting."""
    return get_settings().maximum_quick_transfer_protocols
