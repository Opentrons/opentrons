"""Wrapper to provide the callbacks utilized by the Protocol Engine File Provider."""
import os
import asyncio
import csv
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
from opentrons.protocol_engine.resources.file_provider import GenericCsvTransform


class FileProviderWrapper:
    """Wrapper to provide File Read and Write capabilities to Protocol Engine."""

    def __init__(
        self,
        data_files_directory: Annotated[Path, Depends(get_data_files_directory)],
        data_files_store: Annotated[DataFilesStore, Depends(get_data_files_store)],
    ) -> None:
        """Provides callbacks for data file manipulation for the Protocol Engine's File Provider class.

        Params:
            data_files_directory: The directory to store engine-create files in during a protocol run.
            data_files_store: The data files store utilized for database interaction when creating files.
        """
        self._data_files_directory = data_files_directory
        self._data_files_store = data_files_store

        # dta file store is not generally safe for concurrent access.
        self._lock = asyncio.Lock()

    async def write_csv_callback(
        self,
        csv_data: GenericCsvTransform,
    ) -> str:
        """Write the provided data transform to a CSV file. Returns the File ID of the created file."""
        async with self._lock:
            file_id = await get_unique_id()
            os.makedirs(
                os.path.dirname(
                    self._data_files_directory / file_id / csv_data.filename
                ),
                exist_ok=True,
            )
            with open(
                file=self._data_files_directory / file_id / csv_data.filename,
                mode="w",
                newline="",
            ) as csvfile:
                writer = csv.writer(csvfile, delimiter=csv_data.delimiter)
                writer.writerows(csv_data.rows)

            created_at = await get_current_time()
            # TODO (cb, 10-14-24): Engine created files do not currently get a file_hash, unlike explicitly uploaded files. Do they need one?
            file_info = DataFileInfo(
                id=file_id,
                name=csv_data.filename,
                file_hash="",
                created_at=created_at,
                source=DataFileSource.GENERATED,
            )
            await self._data_files_store.insert(file_info)
            return file_id

    async def csv_filecount_callback(self) -> int:
        """Return the current count of generated files stored within the data files directory."""
        data_file_usage_info = self._data_files_store.get_usage_info(
            DataFileSource.GENERATED
        )
        return len(data_file_usage_info)
