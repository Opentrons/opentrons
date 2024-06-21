import csv
from typing import TypeVar, Union, TypedDict, TextIO, Optional, List

from .exceptions import RuntimeParameterRequired, ParameterValueError


class CSVParameter:
    def __init__(self, csv_file: Optional[TextIO]) -> None:
        self._file = csv_file
        self._rows = []
        self._contents = ""
        if self._file is not None:
            self._file.seek(0)
            self._contents = self._file.read()
            self._file.seek(0)
            try:
                dialect = csv.Sniffer().sniff(self._file.read(1024))
                self._file.seek(0)
                # Weird spacing with commas can sometimes produce a false positive for a non-comma delimiter,
                # so overwrite that and enforce comma as separator for automatic row detection.
                reader = csv.reader(self._file, dialect, delimiter=",")
            except UnicodeDecodeError:
                raise ParameterValueError("Cannot parse provided CSV file.")
            except csv.Error:
                # If we can't sniff the dialect than create the reader with the default and
                # handle any potential failures when parsing rows
                reader = csv.reader(self._file)
            try:
                for row in reader:
                    self._rows.append(row)
            except (UnicodeDecodeError, csv.Error):
                raise ParameterValueError("Cannot parse provided CSV file.")
            self._file.seek(0)

    @property
    def file(self) -> TextIO:
        """Returns the file handler for the CSV file."""
        if self._file is None:
            raise RuntimeParameterRequired(
                "CSV parameter needs to be set to a file for full analysis or run."
            )
        return self._file

    @property
    def contents(self) -> str:
        """Returns the full contents of the CSV file as a single string."""
        if self._file is None:
            raise RuntimeParameterRequired(
                "CSV parameter needs to be set to a file for full analysis or run."
            )
        return self._contents

    def rows(self) -> List[List[str]]:
        """Returns a list of rows with each row represented as a list of column elements.

        If there is a header for the CSV that will be the first row in the list (i.e. `.rows()[0]`).
        All elements will be represented as strings, even if they are numeric in nature.
        """
        if self._file is None:
            raise RuntimeParameterRequired(
                "CSV parameter needs to be set to a file for full analysis or run."
            )
        return self._rows


PrimitiveAllowedTypes = Union[str, int, float, bool]
AllAllowedTypes = Union[str, int, float, bool, TextIO, None]
UserFacingTypes = Union[str, int, float, bool, CSVParameter]

ParamType = TypeVar("ParamType", bound=AllAllowedTypes)


class ParameterChoice(TypedDict):
    """A parameter choice containing the display name and value."""

    display_name: str
    value: PrimitiveAllowedTypes
