"""Dependency functions for use with `fastapi.Depends()`."""

from pathlib import Path
from typing import Annotated

import fastapi

from opentrons.protocol_engine.resources.file_provider import FileProvider
from server_utils.fastapi_utils.app_state import (
    AppState,
    get_app_state,
)

from robot_server.data_files.data_files_store import DataFilesStore
from robot_server.data_files.dependencies import (
    get_data_files_directory,
    get_data_files_store,
)
from robot_server.disk_monitor.dependencies import get_disk_monitor
from robot_server.disk_monitor.monitor import DiskMonitor
from robot_server.file_provider.provider import FileProviderExecutor
from robot_server.persistence.fastapi_dependencies import get_images_directory
from robot_server.service.notifications.publishers import (
    DataFilePublisher,
    get_data_file_publisher,
)
from robot_server.service.pyro_utils.resource_utilities import (
    register_file_provider_to_pyro_resource,
)
from robot_server.settings import RobotServerSettings, get_settings


async def get_file_provider_executor(
    data_files_directory: Annotated[Path, fastapi.Depends(get_data_files_directory)],
    data_files_store: Annotated[DataFilesStore, fastapi.Depends(get_data_files_store)],
    images_directory: Annotated[Path, fastapi.Depends(get_images_directory)],
    disk_monitor: Annotated[DiskMonitor, fastapi.Depends(get_disk_monitor)],
    settings: Annotated[RobotServerSettings, fastapi.Depends(get_settings)],
    publisher: Annotated[DataFilePublisher, fastapi.Depends(get_data_file_publisher)],
) -> FileProviderExecutor:
    """Return the server's singleton `FileProviderExecutor` which provides the engine related callbacks for FileProvider."""
    file_provider_wrapper = FileProviderExecutor(
        data_files_directory=data_files_directory,
        data_files_store=data_files_store,
        images_directory=images_directory,
        disk_monitor=disk_monitor,
        settings=settings,
        publisher=publisher,
    )

    return file_provider_wrapper


async def get_file_provider(
    app_state: Annotated[AppState, fastapi.Depends(get_app_state)],
    file_provider_executor: Annotated[
        FileProviderExecutor, fastapi.Depends(get_file_provider_executor)
    ],
) -> FileProvider:
    """Return the engine `FileProvider` which accepts callbacks from FileProviderWrapper."""
    file_provider = FileProvider(
        data_files_write_file_cb=file_provider_executor.write_file_cb,
    )
    register_file_provider_to_pyro_resource(app_state, file_provider)

    return file_provider
