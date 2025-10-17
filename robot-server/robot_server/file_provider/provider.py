"""Executor for Protocol Engine File Provider callbacks."""
import os
import asyncio
import hashlib
from pathlib import Path
from typing import Annotated, Optional
from fastapi import Depends
from pydantic import BaseModel
from datetime import datetime

from robot_server.persistence.fastapi_dependencies import get_images_directory
from robot_server.data_files.dependencies import (
    get_data_files_directory,
    get_data_files_store,
)
from opentrons_shared_data.data_files import DataFileSource, DataFileInfo
from ..service.dependencies import get_current_time, get_unique_id
from robot_server.data_files.data_files_store import (
    DataFilesStore,
)
from opentrons.protocol_engine.resources.file_provider import (
    FileData,
    ReadCmdFileNameMetadata,
    ImageCaptureCmdFileNameMetadata,
)


class RunFileNameMetadata(BaseModel):
    """Data from the run used that may be used to build a finalized file name."""

    robot_name: str
    run_id: str
    run_created_at: datetime
    protocol_name: Optional[str]


class FileProviderExecutor:
    """Executes file operations for the Protocol Engine File Provider."""

    def __init__(
        self,
        data_files_directory: Annotated[Path, Depends(get_data_files_directory)],
        images_directory: Annotated[Path, Depends(get_images_directory)],
        data_files_store: Annotated[DataFilesStore, Depends(get_data_files_store)],
    ) -> None:
        """Initialize the file provider executor.

        Params:
            data_files_directory: The directory to store engine-created files in during a protocol run.
            data_files_store: The data files store utilized for database interaction when creating files.
        """
        self._data_files_directory = data_files_directory
        self._images_directory = images_directory
        self._data_files_store = data_files_store
        self._run_metadata: RunFileNameMetadata | None = None

        # data file store is not generally safe for concurrent access.
        self._lock = asyncio.Lock()

    def set_run_metadata(self, metadata: RunFileNameMetadata) -> None:
        """Sets metadata specific to the run."""
        self._run_metadata = metadata

    def clear_run_metadata(self) -> None:
        """Clears metadata specific to the run."""
        self._run_metadata = None

    async def write_file_cb(
        self,
        file_data: FileData,
    ) -> DataFileInfo:
        """Write the provided file data to disk. Returns the `DataFileInfo` of the created file."""
        async with self._lock:
            assert self._run_metadata is not None

            file_id = await get_unique_id()
            final_filename = self._format_filename(file_data, file_id)
            final_filepath = self._format_filepath(
                filename=final_filename, file_id=file_id, file_data=file_data
            )
            md5sum = self._get_md5sum(file_data)

            os.makedirs(os.path.dirname(final_filepath), exist_ok=True)

            with open(file=final_filepath, mode="wb") as f:
                f.write(file_data.data)

            created_at = await get_current_time()
            file_info = DataFileInfo(
                id=file_id,
                name=final_filename,
                file_hash=md5sum,
                created_at=created_at,
                source=DataFileSource.GENERATED,
                run_id=self._run_metadata.run_id,
                mime_type=file_data.mime_type,
                # TOME TODO: Update after merging CB's PR!
                command_id=None,
                prev_command_id=None,
                failed_command_id=None,
            )
            await self._data_files_store.insert(file_info)
            return file_info

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
        elif isinstance(file_data.command_metadata, ImageCaptureCmdFileNameMetadata):
            assert self._run_metadata is not None

            cmd_metadata = file_data.command_metadata
            base_name = cmd_metadata.base_filename or ""
            protocol_name = self._run_metadata.protocol_name or ""

            return (
                base_name
                + self._run_metadata.robot_name
                + protocol_name
                + str(self._run_metadata.run_created_at)
                + str(cmd_metadata.step_number)
                + str(cmd_metadata.command_timestamp)
                + ".jpeg"
            )

        else:
            return f"{file_id}.dat"

    def _format_filepath(
        self, filename: str, file_id: str, file_data: FileData
    ) -> Path:
        """Given a finalized filename, return the full filepath for the filename."""
        assert self._run_metadata is not None

        if isinstance(file_data.command_metadata, ReadCmdFileNameMetadata):
            return self._data_files_directory / file_id / filename
        elif isinstance(file_data.command_metadata, ImageCaptureCmdFileNameMetadata):
            return self._images_directory / self._run_metadata.run_id / filename
        else:
            return self._data_files_directory / filename

    def _get_md5sum(self, file_data: FileData) -> str:
        """Returns the md5 checksum of the provided file data."""
        return hashlib.md5(file_data.data).hexdigest()
