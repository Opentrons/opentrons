"""Dependency functions for use with `fastapi.Depends()`."""
from pathlib import Path
from typing import Annotated

import fastapi

from robot_server.file_provider.provider import FileProviderWrapper
from robot_server.data_files.dependencies import (
    get_data_files_directory,
    get_data_files_store,
)
from robot_server.data_files.data_files_store import DataFilesStore
from opentrons.protocol_engine.resources.file_provider import FileProvider


async def get_file_provider_wrapper(
    data_files_directory: Annotated[Path, fastapi.Depends(get_data_files_directory)],
    data_files_store: Annotated[DataFilesStore, fastapi.Depends(get_data_files_store)],
) -> FileProviderWrapper:
    """Return the server's singleton `FileProviderWrapper` which provides the engine related callbacks for FileProvider."""
    file_provider_wrapper = FileProviderWrapper(
        data_files_directory=data_files_directory, data_files_store=data_files_store
    )

    return file_provider_wrapper


async def get_file_provider(
    file_provider_wrapper: Annotated[
        FileProviderWrapper, fastapi.Depends(get_file_provider_wrapper)
    ],
) -> FileProvider:
    """Return the engine `FileProvider` which accepts callbacks from FileProviderWrapper."""
    file_provider = FileProvider(
        data_files_write_csv_callback=file_provider_wrapper.write_csv_callback,
        data_files_filecount=file_provider_wrapper.csv_filecount_callback,
    )

    return file_provider
