"""File interaction resource provider."""
from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional, cast, Callable, Awaitable, Dict

MAXIMUM_CSV_FILE_LIMIT = 40


class GenericCsvTransform:
    """Generic CSV File Type data for rows of data to be seperated by a delimeter."""

    filename: str
    rows: List[List[str]]
    delimiter: Optional[str] = ","

    @staticmethod
    def build(
        filename: str, rows: List[List[str]], delimiter: Optional[str] = ","
    ) -> "GenericCsvTransform":
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


class ReadData:
    wavelength: int
    data: Dict[str, float]

    @staticmethod
    def build(wavelength: int, data: Dict[str, float]) -> "ReadData":
        read = ReadData()
        read.wavelength = wavelength
        read.data = data
        return read


class PlateReaderDataTransform:
    """Data from a Opentrons Plate Reader Read. Can be converted to CSV template format."""

    read_results: List[ReadData]
    reference_wavelength: Optional[int] = None
    start_time: datetime
    finish_time: datetime
    serial_number: str

    def build_generic_csv(
        self, filename: str, measurement: ReadData
    ) -> GenericCsvTransform:
        """Builds a CSV compatible object containing Plate Reader Measurements.
        This will also automatically reformat the provided filename to include the wavelength of those measurements.
        """
        plate_alpharows = ["A", "B", "C", "D", "E", "F", "G", "H"]
        rows = []

        # line 1
        rows.append(["", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"])

        # lines 2-9
        for i in range(8):
            row = [plate_alpharows[i]]
            for j in range(12):
                row.append(str(measurement.data[f"{plate_alpharows[i]}{i+1}"]))
            rows.append(row)

        # lines 10-12 are empty
        for i in range(3):
            rows.append([""])
        # line 13
        rows[12] = ["", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]
        # lines 14 through 21
        for i in range(8):
            row = [plate_alpharows[i]]
            for j in range(12):
                row.append("")
            rows.append(row)

        # lines 22-24 are empty
        for i in range(3):
            rows.append([""])

        # line 25
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

        # lines 26-28 are empty
        for i in range(3):
            rows.append([""])

        # line 29
        rows.append(
            [
                "",
                "ID",
                "Well,Absorbance (OD)",
                "Mean Absorbance (OD)",
                "Dilution Factor",
                "Absorbance %CV",
            ]
        )
        rows.append(["1", "Sample 1", "", "", "", "1", "", "", "", "", "", ""])

        # lines 31-33 are empty
        for i in range(3):
            rows.append([""])

        # end of file metadata
        rows.append(["Protocol"])
        rows.append(["Assay"])
        rows.append(["Sample Wavelength (nm)", str(measurement.wavelength)])
        if self.reference_wavelength is not None:
            rows.append(["Reference Wavelength (nm)", str(self.reference_wavelength)])
        rows.append(["Serial No.", self.serial_number])
        rows.append(["Measurement started at", str(self.start_time)])
        rows.append(["Measurement finished at", str(self.finish_time)])

        # Ensure the filename contains the wavelength for a given measurement
        if filename.endswith(".csv"):
            filename = filename[:-4]
        filename = filename + "_" + str(measurement.wavelength) + ".csv"

        csv_data = GenericCsvTransform.build(
            filename=filename,
            rows=rows,
            delimiter=",",
        )
        return csv_data

    @staticmethod
    def build(
        read_results: List[ReadData],
        start_time: datetime,
        finish_time: datetime,
        serial_number: str,
        reference_wavelength: Optional[int] = None,
    ) -> "PlateReaderDataTransform":
        plate_reader_data = PlateReaderDataTransform()
        plate_reader_data.read_results = read_results
        plate_reader_data.reference_wavelength = reference_wavelength
        plate_reader_data.start_time = start_time
        plate_reader_data.finish_time = finish_time
        plate_reader_data.serial_number = serial_number
        return plate_reader_data


class FileProvider:
    """Provider class to wrap file read write interactions to the data files directory in the engine."""

    def __init__(
        self,
        data_files_write_csv_callback: Optional[
            Callable[[GenericCsvTransform], None]
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

    async def write_csv(self, write_data: GenericCsvTransform) -> None:
        if self._data_files_filecount is not None:
            file_count = await self._data_files_filecount()
            if file_count >= MAXIMUM_CSV_FILE_LIMIT:
                raise ValueError(
                    f"Not enough space to store file {write_data.filename}."
                )
            if self._data_files_write_csv_callback is not None:
                self._data_files_write_csv_callback(write_data)
