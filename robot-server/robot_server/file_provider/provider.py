"""Executor for Protocol Engine File Provider callbacks."""
import os
import asyncio
import hashlib
from pathlib import Path
from typing import Annotated
from fastapi import Depends

from robot_server.persistence.fastapi_dependencies import get_images_directory
from robot_server.data_files.dependencies import (
    get_data_files_directory,
    get_data_files_store,
)
from opentrons_shared_data.data_files import (
    OutputDataFileInfo,
    DataFileInfo,
    CmdDataFileInfo,
)
from robot_server.settings import get_settings, RobotServerSettings
from ..service.dependencies import get_current_time, get_unique_id
from robot_server.data_files.data_files_store import (
    DataFilesStore,
)
from opentrons.protocol_engine.errors import StorageLimitReachedError
from robot_server.disk_monitor.dependencies import get_disk_monitor
from robot_server.disk_monitor.monitor import DiskMonitor
from opentrons.protocol_engine.resources.file_provider import (
    FileData,
    ReadCmdFileNameMetadata,
    ImageCaptureCmdFileNameMetadata,
)


class FileProviderExecutor:
    """Executes file operations for the Protocol Engine File Provider."""

    def __init__(
        self,
        data_files_directory: Annotated[Path, Depends(get_data_files_directory)],
        images_directory: Annotated[Path, Depends(get_images_directory)],
        data_files_store: Annotated[DataFilesStore, Depends(get_data_files_store)],
        disk_monitor: Annotated[DiskMonitor, Depends(get_disk_monitor)],
        settings: Annotated[RobotServerSettings, Depends(get_settings)],
    ) -> None:
        """Initialize the file provider executor.

        Params:
            data_files_directory: The directory to store engine-created files in during a protocol run.
            data_files_store: The data files store utilized for database interaction when creating files.
        """
        self._data_files_directory = data_files_directory
        self._images_directory = images_directory
        self._data_files_store = data_files_store
        self._disk_monitor = disk_monitor
        self._images_directory_max_size_mb = settings.images_directory_max_size_mb
        self._system_low_space_threshold_mb = settings.system_low_space_threshold_mb

        # data file store is not generally safe for concurrent access.
        self._lock = asyncio.Lock()

    async def write_file_cb(
        self,
        file_data: FileData,
    ) -> DataFileInfo:
        """Write the provided file data to disk. Returns the `DataFileInfo` of the created file."""
        if (
            isinstance(file_data.command_metadata, ImageCaptureCmdFileNameMetadata)
            and self._disk_monitor.is_images_directory_over_limit()
        ):
            raise StorageLimitReachedError(
                message=f"Attempt to write file to disk exceeds file the "
                f"image file storage limit of {self._images_directory_max_size_mb}MB"
            )

        if self._disk_monitor.is_disk_space_low():
            raise StorageLimitReachedError(
                message=f"Attempt to write file to disk exceeds file the "
                f"system free disk space requirement of {self._system_low_space_threshold_mb}MB"
            )

        async with self._lock:
            file_id = await get_unique_id()
            final_filename = self._format_filename(file_data, file_id)
            final_filepath = self._format_filepath(
                filename=final_filename, file_id=file_id, file_data=file_data
            )
            md5sum = self._get_md5sum(file_data)
            command_id = file_data.command_metadata.command_id
            prev_command_id = file_data.command_metadata.prev_command_id

            os.makedirs(os.path.dirname(final_filepath), exist_ok=True)

            with open(file=final_filepath, mode="wb") as f:
                f.write(file_data.data)

            created_at = await get_current_time()
            file_info = DataFileInfo(
                id=file_id,
                name=final_filename,
                file_hash=md5sum,
                path=str(final_filepath),
                created_at=created_at,
                mime_type=file_data.mime_type,
                stored=True,
                generated=True,
            )
            output_file_info = OutputDataFileInfo(
                file_id=file_id,
                run_id=file_data.run_metadata.run_id,
                command_info=CmdDataFileInfo(
                    command_id=command_id, prev_command_id=prev_command_id
                ),
            )

            await self._data_files_store.insert(file_info)
            await self._data_files_store.insert_output_file(output_file_info)
            return file_info

    async def filecount_cb(self) -> int:
        """Return the current count of generated files stored within the data files directory."""
        data_file_usage_info = self._data_files_store.get_usage_info(generated=True)
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
            cmd_metadata = file_data.command_metadata
            base_name = (
                f"{cmd_metadata.base_filename}_" if cmd_metadata.base_filename else ""
            )
            protocol_name = file_data.run_metadata.protocol_name or ""

            return (
                base_name
                + file_data.run_metadata.robot_name
                + "_"
                + protocol_name
                + "_"
                + str(file_data.run_metadata.run_created_at)
                + "_"
                + str(cmd_metadata.step_number)
                + "_"
                + str(cmd_metadata.command_timestamp)
                + ".jpeg"
            )

        else:
            return f"{file_id}.dat"

    def _format_filepath(
        self, filename: str, file_id: str, file_data: FileData
    ) -> Path:
        """Given a finalized filename, return the full filepath for the filename."""
        if isinstance(file_data.command_metadata, ReadCmdFileNameMetadata):
            return self._data_files_directory / file_id / filename
        elif isinstance(file_data.command_metadata, ImageCaptureCmdFileNameMetadata):
            return self._images_directory / file_data.run_metadata.run_id / filename
        else:
            return self._data_files_directory / filename

    def _get_md5sum(self, file_data: FileData) -> str:
        """Returns the md5 checksum of the provided file data."""
        return hashlib.md5(file_data.data).hexdigest()
