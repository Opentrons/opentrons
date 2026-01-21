"""File interaction resource provider."""

import csv
from dataclasses import dataclass
from datetime import datetime
from io import StringIO
from typing import Awaitable, Callable, Dict, List, Optional

from pydantic import BaseModel

from opentrons_shared_data.data_files import (
    DataFileInfo,
    MimeType,
    RunFileNameMetadata,
)

SPECIAL_CHARACTERS = {
    "#",
    "%",
    "&",
    "{",
    "}",
    "\\",
    "/",
    "<",
    ">",
    "*",
    "$",
    "!",
    "?",
    ".",
    "'",
    '"',
    ":",
    ";",
    "@",
    "`",
    "|",
}


@dataclass(frozen=True)
class FileNameCmdMetadata:
    """Command metadata associated with a specific data file."""

    command_id: str
    prev_command_id: str


@dataclass(frozen=True)
class ReadCmdFileNameMetadata(FileNameCmdMetadata):
    """Data from a plate reader `read` command used to build the finalized file name."""

    base_filename: str
    wavelength: int


@dataclass(frozen=True)
class ImageCaptureCmdFileNameMetadata(FileNameCmdMetadata):
    """Data from a camera capture command used to build the finalized file name."""

    step_number: int
    command_timestamp: datetime
    base_filename: Optional[str]


CommandFileNameMetadata = ReadCmdFileNameMetadata | ImageCaptureCmdFileNameMetadata


class FileData:
    """File data container for writing to a file."""

    data: bytes
    mime_type: MimeType
    run_metadata: RunFileNameMetadata
    command_metadata: CommandFileNameMetadata

    @staticmethod
    def build(
        data: bytes,
        mime_type: MimeType,
        run_metadata: RunFileNameMetadata,
        command_metadata: CommandFileNameMetadata,
    ) -> "FileData":
        """Build a generic file data class."""
        file_data = FileData()
        file_data.data = data
        file_data.mime_type = mime_type
        file_data.run_metadata = run_metadata
        file_data.command_metadata = command_metadata
        return file_data


class ReadData(BaseModel):
    """Read Data type containing the wavelength for a Plate Reader read alongside the Measurement Data of that read."""

    wavelength: int
    data: Dict[str, float]


class PlateReaderData(BaseModel):
    """Data from an Opentrons Plate Reader Read. Can be converted to CSV format."""

    read_results: List[ReadData]
    reference_wavelength: Optional[int] = None
    start_time: datetime
    finish_time: datetime
    serial_number: str

    def build_csv_bytes(self, measurement: ReadData) -> bytes:  # noqa: C901
        """Builds CSV data as bytes containing Plate Reader Measurements."""
        plate_alpharows = ["A", "B", "C", "D", "E", "F", "G", "H"]
        rows = []

        rows.append(["", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"])
        for i in range(8):
            row = [plate_alpharows[i]]
            for j in range(12):
                row.append(str(measurement.data[f"{plate_alpharows[i]}{j + 1}"]))
            rows.append(row)
        for i in range(3):
            rows.append([])
        rows.append(["", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"])
        for i in range(8):
            row = [plate_alpharows[i]]
            for j in range(12):
                row.append("")
            rows.append(row)
        for i in range(3):
            rows.append([])
        rows.append(
            [
                "",
                "ID",
                "Well",
                "Absorbance (OD)",
                "Mean Absorbance (OD)",
                "Absorbance %CV",
            ]
        )
        for i in range(3):
            rows.append([])
        rows.append(
            [
                "",
                "ID",
                "Well",
                "Absorbance (OD)",
                "Mean Absorbance (OD)",
                "Dilution Factor",
                "Absorbance %CV",
            ]
        )
        rows.append(["1", "Sample 1", "", "", "", "1", "", "", "", "", "", ""])
        for i in range(3):
            rows.append([])

        # end of file metadata
        rows.append(["Protocol"])
        rows.append(["Assay"])
        rows.append(["Sample Wavelength (nm)", str(measurement.wavelength)])
        if self.reference_wavelength is not None:
            rows.append(["Reference Wavelength (nm)", str(self.reference_wavelength)])
        rows.append(["Serial No.", self.serial_number])
        rows.append(
            ["Measurement started at", self.start_time.strftime("%m %d %H:%M:%S %Y")]
        )
        rows.append(
            ["Measurement finished at", self.finish_time.strftime("%m %d %H:%M:%S %Y")]
        )

        output = StringIO()
        writer = csv.writer(output, delimiter=",")
        writer.writerows(rows)
        csv_bytes = output.getvalue().encode("utf-8")

        return csv_bytes


class FileProvider:
    """Provider class to wrap file read write interactions to the data files directory in the engine."""

    def __init__(
        self,
        data_files_write_file_cb: Optional[
            Callable[[FileData], Awaitable[DataFileInfo]]
        ] = None,
    ) -> None:
        """Initialize the interface callbacks of the File Provider for data file handling within the Protocol Engine.

        Params:
            data_files_write_file_callback: Callback to write a file to the data files directory and add it to the database.
            data_files_filecount: Callback to check the amount of data files already present in the data files directory.
        """
        self._data_files_write_file_cb = data_files_write_file_cb
        self._run_metadata: RunFileNameMetadata | None = None

    async def write_file(
        self,
        data: bytes,
        mime_type: MimeType,
        command_metadata: CommandFileNameMetadata,
    ) -> DataFileInfo:
        """Writes arbitrary data to a file in the Data Files directory.

        Returns the `DataFileInfo` of the file created.

        Raises:
            Note that the callback may raise a StorageLimitReachedError.
        """
        if self._data_files_write_file_cb is not None:
            assert self._run_metadata is not None
            file_data = FileData.build(
                data=data,
                mime_type=mime_type,
                command_metadata=command_metadata,
                run_metadata=self._run_metadata,
            )

            return await self._data_files_write_file_cb(file_data)
        # If we are in an analysis or simulation state, return an empty `DataFileInfo`
        return DataFileInfo(
            id="",
            name="",
            file_hash="",
            created_at=datetime.now(),
            generated=True,
            stored=False,
            path="",
            mime_type=mime_type,
        )

    def set_run_metadata(self, metadata: RunFileNameMetadata) -> None:
        """Sets metadata specific to the run."""
        self._run_metadata = metadata

    def clear_run_metadata(self) -> None:
        """Clears metadata specific to the run."""
        self._run_metadata = None
