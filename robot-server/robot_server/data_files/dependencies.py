"""FastAPI dependencies for data files endpoints."""
from pathlib import Path
from asyncio import Lock as AsyncLock
from typing import Annotated
from anyio import Path as AsyncPath

from fastapi import Depends
from sqlalchemy.engine import Engine as SQLEngine

from server_utils.fastapi_utils.app_state import (
    AppState,
    get_app_state,
    AppStateAccessor,
)
from robot_server.settings import get_settings
from robot_server.persistence.fastapi_dependencies import (
    get_active_persistence_directory,
    get_sql_engine,
)
from robot_server.persistence.file_and_directory_names import DATA_FILES_DIRECTORY
from robot_server.deletion_planner import DataFileDeletionPlanner
from .data_files_store import DataFilesStore
from .file_auto_deleter import DataFileAutoDeleter


_data_files_directory_init_lock = AsyncLock()
_data_files_directory_accessor = AppStateAccessor[Path]("data_files_directory")

_data_files_store_init_lock = AsyncLock()
_data_files_store_accessor = AppStateAccessor[DataFilesStore]("data_files_store")


async def get_data_files_directory(
    app_state: Annotated[AppState, Depends(get_app_state)],
    persistent_directory: Annotated[Path, Depends(get_active_persistence_directory)],
) -> Path:
    """Get the directory to save the protocol files, creating it if needed."""
    async with _data_files_directory_init_lock:
        data_files_dir = _data_files_directory_accessor.get_from(app_state)
        if data_files_dir is None:
            data_files_dir = persistent_directory / DATA_FILES_DIRECTORY
            await AsyncPath(data_files_dir).mkdir(exist_ok=True)
            _data_files_directory_accessor.set_on(app_state, data_files_dir)

        return data_files_dir


async def get_data_files_store(
    app_state: Annotated[AppState, Depends(get_app_state)],
    sql_engine: Annotated[SQLEngine, Depends(get_sql_engine)],
    data_files_directory: Annotated[Path, Depends(get_data_files_directory)],
) -> DataFilesStore:
    """Get a singleton DataFilesStore to keep track of uploaded data files."""
    async with _data_files_store_init_lock:
        data_files_store = _data_files_store_accessor.get_from(app_state)
        if data_files_store is None:
            data_files_store = DataFilesStore(sql_engine, data_files_directory)
            _data_files_store_accessor.set_on(app_state, data_files_store)
        return data_files_store


def get_data_file_auto_deleter(
    data_files_store: Annotated[DataFilesStore, Depends(get_data_files_store)],
) -> DataFileAutoDeleter:
    """Get a `DataFileAutoDeleter` to delete old data files."""
    return DataFileAutoDeleter(
        data_files_store=data_files_store,
        deletion_planner=DataFileDeletionPlanner(
            maximum_files=get_settings().maximum_data_files
        ),
    )
