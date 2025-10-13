"""Executor for Protocol Engine File Provider callbacks."""
import os
import asyncio
from pathlib import Path
from typing import Annotated
from fastapi import Depends
from robot_server.data_files.dependencies import (
    get_data_files_directory,
    get_data_files_store,
)
from robot_server.data_files.models import DataFileSource
from ..service.dependencies import get_current_time, get_unique_id
from robot_server.data_files.data_files_store import (
    DataFilesStore,
    DataFileInfo,
)
from opentrons.protocol_engine.resources.file_provider import (
    FileData,
    ReadCmdFileNameMetadata,
)


class FileProviderExecutor:
    """Executes file operations for the Protocol Engine File Provider."""

    def __init__(
        self,
        data_files_directory: Annotated[Path, Depends(get_data_files_directory)],
        data_files_store: Annotated[DataFilesStore, Depends(get_data_files_store)],
    ) -> None:
        """Initialize the file provider executor.

        Params:
            data_files_directory: The directory to store engine-created files in during a protocol run.
            data_files_store: The data files store utilized for database interaction when creating files.
        """
        self._data_files_directory = data_files_directory
        self._data_files_store = data_files_store

        # data file store is not generally safe for concurrent access.
        self._lock = asyncio.Lock()

    async def write_file_cb(
        self,
        file_data: FileData,
    ) -> str:
        """Write the provided file data to disk. Returns the File ID of the created file."""
        async with self._lock:
            file_id = await get_unique_id()
            final_filename = self._format_filename(file_data, file_id)
            final_filepath = self._format_filepath(
                filename=final_filename, file_id=file_id, file_data=file_data
            )

            os.makedirs(os.path.dirname(final_filepath), exist_ok=True)

            with open(file=final_filepath, mode="wb") as f:
                f.write(file_data.data)

            created_at = await get_current_time()
            file_info = DataFileInfo(
                id=file_id,
                name=final_filename,
                file_hash="",
                created_at=created_at,
                source=DataFileSource.GENERATED,
            )
            await self._data_files_store.insert(file_info)
            return file_id

    async def filecount_cb(self) -> int:
        """Return the current count of generated files stored within the data files directory."""
        data_file_usage_info = self._data_files_store.get_usage_info(
            DataFileSource.GENERATED
        )
        return len(data_file_usage_info)

    def _format_filename(self, file_data: FileData, file_id: str) -> str:
        """Build the finalized filename."""
        if isinstance(file_data.command_metadata, ReadCmdFileNameMetadata):
            metadata = file_data.command_metadata
            base_name = metadata.base_filename

            if base_name.endswith(".csv"):
                base_name = base_name[:-4]

            return base_name + str(metadata.wavelength) + "nm.csv"
        else:
            return f"{file_id}.dat"

    def _format_filepath(
        self, filename: str, file_id: str, file_data: FileData
    ) -> Path:
        """Given a finalized filename, return the full filepath for the filename."""
        if isinstance(file_data.command_metadata, ReadCmdFileNameMetadata):
            return self._data_files_directory / file_id / filename
        else:
            return self._data_files_directory / filename
