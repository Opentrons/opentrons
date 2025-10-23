"""Dependency functions for use with `fastapi.Depends()`."""
from pathlib import Path
from typing import Annotated

import fastapi

from robot_server.persistence.fastapi_dependencies import get_images_directory
from robot_server.file_provider.provider import FileProviderExecutor
from robot_server.data_files.dependencies import (
    get_data_files_directory,
    get_data_files_store,
)
from robot_server.data_files.data_files_store import DataFilesStore
from opentrons.protocol_engine.resources.file_provider import FileProvider
from robot_server.disk_monitor.dependencies import get_disk_monitor
from robot_server.disk_monitor.monitor import DiskMonitor
from robot_server.settings import get_settings, RobotServerSettings


async def get_file_provider_executor(
    data_files_directory: Annotated[Path, fastapi.Depends(get_data_files_directory)],
    data_files_store: Annotated[DataFilesStore, fastapi.Depends(get_data_files_store)],
    images_directory: Annotated[Path, fastapi.Depends(get_images_directory)],
    disk_monitor: Annotated[DiskMonitor, fastapi.Depends(get_disk_monitor)],
    settings: Annotated[RobotServerSettings, fastapi.Depends(get_settings)],
) -> FileProviderExecutor:
    """Return the server's singleton `FileProviderExecutor` which provides the engine related callbacks for FileProvider."""
    file_provider_wrapper = FileProviderExecutor(
        data_files_directory=data_files_directory,
        data_files_store=data_files_store,
        images_directory=images_directory,
        disk_monitor=disk_monitor,
        settings=settings,
    )

    return file_provider_wrapper


async def get_file_provider(
    file_provider_executor: Annotated[
        FileProviderExecutor, fastapi.Depends(get_file_provider_executor)
    ],
) -> FileProvider:
    """Return the engine `FileProvider` which accepts callbacks from FileProviderWrapper."""
    file_provider = FileProvider(
        data_files_write_file_cb=file_provider_executor.write_file_cb,
        data_files_filecount=file_provider_executor.filecount_cb,
    )

    return file_provider
