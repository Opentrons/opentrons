"""File interaction resource provider."""
from datetime import datetime
from typing import List, Optional, Callable, Awaitable, Dict
from pydantic import BaseModel
from ..errors import StorageLimitReachedError


MAXIMUM_CSV_FILE_LIMIT = 400


class GenericCsvTransform:
    """Generic CSV File Type data for rows of data to be seperated by a delimeter."""

    filename: str
    rows: List[List[str]]
    delimiter: str = ","

    @staticmethod
    def build(
        filename: str, rows: List[List[str]], delimiter: str = ","
    ) -> "GenericCsvTransform":
        """Build a Generic CSV datatype class."""
        if "." in filename and not filename.endswith(".csv"):
            raise ValueError(
                f"Provided filename {filename} invalid. Only CSV file format is accepted."
            )
        elif "." not in filename:
            filename = f"{filename}.csv"
        csv = GenericCsvTransform()
        csv.filename = filename
        csv.rows = rows
        csv.delimiter = delimiter
        return csv


class ReadData(BaseModel):
    """Read Data type containing the wavelength for a Plate Reader read alongside the Measurement Data of that read."""

    wavelength: int
    data: Dict[str, float]


class PlateReaderData(BaseModel):
    """Data from a Opentrons Plate Reader Read. Can be converted to CSV template format."""

    read_results: List[ReadData]
    reference_wavelength: Optional[int] = None
    start_time: datetime
    finish_time: datetime
    serial_number: str

    def build_generic_csv(  # noqa: C901
        self, filename: str, measurement: ReadData
    ) -> GenericCsvTransform:
        """Builds a CSV compatible object containing Plate Reader Measurements.

        This will also automatically reformat the provided filename to include the wavelength of those measurements.
        """
        plate_alpharows = ["A", "B", "C", "D", "E", "F", "G", "H"]
        rows = []

        rows.append(["", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"])
        for i in range(8):
            row = [plate_alpharows[i]]
            for j in range(12):
                row.append(str(measurement.data[f"{plate_alpharows[i]}{j+1}"]))
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

        # Ensure the filename adheres to ruleset contains the wavelength for a given measurement
        if filename.endswith(".csv"):
            filename = filename[:-4]
        filename = filename + str(measurement.wavelength) + "nm.csv"

        return GenericCsvTransform.build(
            filename=filename,
            rows=rows,
            delimiter=",",
        )


class FileProvider:
    """Provider class to wrap file read write interactions to the data files directory in the engine."""

    def __init__(
        self,
        data_files_write_csv_callback: Optional[
            Callable[[GenericCsvTransform], Awaitable[str]]
        ] = None,
        data_files_filecount: Optional[Callable[[], Awaitable[int]]] = None,
    ) -> None:
        """Initialize the interface callbacks of the File Provider for data file handling within the Protocol Engine.

        Params:
            data_files_write_csv_callback: Callback to write a CSV file to the data files directory and add it to the database.
            data_files_filecount: Callback to check the amount of data files already present in the data files directory.
        """
        self._data_files_write_csv_callback = data_files_write_csv_callback
        self._data_files_filecount = data_files_filecount

    async def write_csv(self, write_data: GenericCsvTransform) -> str:
        """Writes the provided CSV object to a file in the Data Files directory. Returns the File ID of the file created."""
        if self._data_files_filecount is not None:
            file_count = await self._data_files_filecount()
            if file_count >= MAXIMUM_CSV_FILE_LIMIT:
                raise StorageLimitReachedError(
                    f"Not enough space to store file {write_data.filename}."
                )
            if self._data_files_write_csv_callback is not None:
                return await self._data_files_write_csv_callback(write_data)
        # If we are in an analysis or simulation state, return an empty file ID
        return ""
