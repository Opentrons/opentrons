import csv
from typing import TypeVar, Union, TypedDict, TextIO, Optional, List

from .exceptions import RuntimeParameterRequired, ParameterValueError


class CSVParameter:
    def __init__(self, csv_file: Optional[TextIO]) -> None:
        self._file = csv_file
        self._rows: List[List[str]] = []
        self._contents: Optional[str] = None

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
        if self._contents is None:
            self.file.seek(0)
            self._contents = self.file.read()
        return self._contents

    def rows(self) -> List[List[str]]:
        """Returns a list of rows with each row represented as a list of column elements.

        If there is a header for the CSV that will be the first row in the list (i.e. `.rows()[0]`).
        All elements will be represented as strings, even if they are numeric in nature.
        """
        if not self._rows:
            try:
                dialect = csv.Sniffer().sniff(self.file.read(1024))
                self.file.seek(0)
                # Weird spacing with commas can sometimes produce a false positive for a non-comma delimiter,
                # so overwrite that and enforce comma as separator for automatic row detection.
                reader = csv.reader(self.file, dialect, delimiter=",")
            except UnicodeDecodeError:
                raise ParameterValueError("Cannot parse provided CSV file.")
            except csv.Error:
                # If we can't sniff the dialect than create the reader with the default and
                # handle any potential failures when parsing rows
                reader = csv.reader(self.file)
            try:
                for row in reader:
                    self._rows.append(row)
            except (UnicodeDecodeError, csv.Error):
                raise ParameterValueError("Cannot parse provided CSV file.")
            self.file.seek(0)
        return self._rows


PrimitiveAllowedTypes = Union[str, int, float, bool]
AllAllowedTypes = Union[str, int, float, bool, TextIO, None]
UserFacingTypes = Union[str, int, float, bool, CSVParameter]

ParamType = TypeVar("ParamType", bound=AllAllowedTypes)


class ParameterChoice(TypedDict):
    """A parameter choice containing the display name and value."""

    display_name: str
    value: PrimitiveAllowedTypes
