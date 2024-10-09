import asyncio
import csv
from datetime import datetime
from pathlib import Path
from typing import Optional, TypeAlias, Annotated, Dict
from fastapi import APIRouter, UploadFile, File, Form, Depends, Response, status
from robot_server.data_files.dependencies import (
    get_data_files_directory,
    get_data_files_store,
)
from robot_server.data_files.data_files_store import DataFilesStore, DataFileInfo

import anyio


PlateReaderDataType= Dict[str, Dict[str, float]]

def plate_reader_csv_files_as_rows_builder(data: PlateReaderDataType)->Dict[str, list[list[str]]]:
    #Plate reader CSVs begin with a single comma, followed by 1-12 (comma seperate)
    #they then have a row seperator \\n
    #followed by a letter A-H
    #12 comma seperated values (the floats for that row)
    #followed by \\n
    #repeat until final row
    #3 sets of \\n,,,,,,,,,,,,
    #next set of samples (1-12, A-H pattern above)
    #follwed by \\n,,,,,,,,,,,,\\n,,,,,,,,,,,,\\n,,,,,,,,,,,,
    #followed by \\nSample Wavelength (nm),450,,,,,,,,,,,\\nReference Wavelength (nm),750,,,,,,,,,,,


    #so each "row" should be a list of 13 strings
    # each string in the row should be one of the 13 items we see in the example row
    #row 1:
    # "" "1" "2" "3" "4" "5" "6" "7" "8" "9" "10" "11" "12"

    #for each wavelength we're going to generate one file for now
    #more complicated file generation can come later
    _table_header = ["","1","2","3","4","5","6","7","8","9","10","11","12"]
    _row_alphas = ["A", "B", "C", "D", "E", "F", "G", "H"]
    _empty_row = ["","","","","","","","","","","","",""]

    files_as_rows = Dict[str, list[list[str]]]
    for wavelength in data:
        rows = [[str]]
        rows.append(_table_header)
        for alpha in _row_alphas:
            row = [str]
            row.append(alpha)
            for i in range(12):
                #index into the listing by 12 * counter
                #proceed forward from here for each member of the selection
                #do this for a count of 12
                index = i * 12
                #CASEY TODO: finish this bit

            rows.append(row)
        
        #next handle 3 empty rows
        for i in range(3):
            rows.append(_empty_row)
        
        #next handle the sample wavelength ID
        wavelength_row = ["Sample Wavelength (nm)",wavelength,"","","","","","","","","","",""]

                




        files_as_rows[wavelength] = rows

    return files_as_rows

        

def filename_formatter(path:Path) -> Path:
    # we need to format the files to include the wavelength name within
    return path


class FileProviderStore:
    def __init__(
        self,
        data_files_directory: Annotated[Path, Depends(get_data_files_directory)],
        data_files_store: Annotated[DataFilesStore, Depends(get_data_files_store)],
    ) -> None:
        """A persistent store to provide data file manipulation for the Protocol Engine.

        Params:
            deck_type: The type of deck that this robot has. This is used to choose the default
                deck configuration.
            persistence_directory: The path of the deck configuration file. The file itself does not need to exist
                yet, but its containing directory should.
        """

        self._data_files_directory = data_files_directory
        self._data_files_store = data_files_store

        # dta file store is not generally safe for concurrent access.
        self._lock = asyncio.Lock()

# CASEY NOTE: replace with write command, accepts a file name and some kind of templated data set
# we want a modules.py file that includes data types for out file template types, then a type union thing of alll templates that this accepts
# we can have all the writes accept this union
# so long as the submitted type is a member of this union, we're good

# file xform type will include file formatting as well as acceptable extension for file name


    async def write(
        self, filename: str, data: DataTransform
    ) -> bool:
        """Write the provided data transform to a CSV file.
        
        """
        storable_deck_configuration = _http_types_to_storage_types(
            request, last_modified_at
        )
        async with self._lock:
            await _writecsv(
                path=self._path, storable_deck_configuration=storable_deck_configuration
            )
            self._deck_configuration_publisher.publish_deck_configuration()

            return await self._get_assuming_locked()


# CASEY NOTE: we need infrastructure in place to read generics back to a known Xform, such as the plate reader data format
    async def read(self, path: Path) -> DataTransform:
        """Get the file from the Data Files Store at a given path."""
        from_storage = await _read(anyio.Path(path))
        converted = convert_to_xform(from_storage)
        return converted


    async def delete(self, path: Path) -> None:
        """Delete the file at the provided path."""
        async with self._lock:
            await path.unlink(missing_ok=True)





# CASEY NOTE: for these two, prehaps we need read and write CSV specific functions, to make life easy
# format can be a provided generic data type that maps back to the provided "template" from the byonouy file type
async def _read(
    path: anyio.Path,
) -> csv.reader | None:
    """Read a CSV file reader from the file system.

    Return `None` if the file is missing or corrupt.
    """
    try:
        with open(file=path, newline='\n') as csvfile:
            csv_reader = csv.reader(csvfile=csvfile, delimiter=",")
    except FileNotFoundError:
        csv_reader = None
    return csv_reader

# CASEY NOTE: only let them read and write CSV files
# with that, maybe we should determine the file format first thing tomorrow

async def _write_plate_reader_csv(
    filepath: str,
    rows: list[list[str]],
) -> None:
    
    writer = csv.writer(csvfile=filepath, lineterminator="\\n")

    for row in rows:
        writer.writerow(row)
