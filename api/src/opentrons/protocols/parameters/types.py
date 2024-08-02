import csv
from typing import TypeVar, Union, TypedDict, TextIO, Optional, List, Any

from .exceptions import RuntimeParameterRequired, ParameterValueError


# TODO(jbl 2024-08-02) This is a public facing class and as such should be moved to the protocol_api folder
class CSVParameter:
    def __init__(self, csv_file: Optional[TextIO]) -> None:
        self._file = csv_file
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

    def parse_as_csv(
        self, detect_dialect: bool = True, **kwargs: Any
    ) -> List[List[str]]:
        """Returns a list of rows with each row represented as a list of column elements.

        If there is a header for the CSV that will be the first row in the list (i.e. `.rows()[0]`).
        All elements will be represented as strings, even if they are numeric in nature.
        """
        rows: List[List[str]] = []
        if detect_dialect:
            try:
                self.file.seek(0)
                dialect = csv.Sniffer().sniff(self.file.read(1024))
                self.file.seek(0)
                reader = csv.reader(self.file, dialect, **kwargs)
            except (UnicodeDecodeError, csv.Error):
                raise ParameterValueError(
                    "Cannot parse dialect or contents from provided CSV file."
                )
        else:
            try:
                reader = csv.reader(self.file, **kwargs)
            except (UnicodeDecodeError, csv.Error):
                raise ParameterValueError("Cannot parse provided CSV file.")
        try:
            for row in reader:
                rows.append(row)
        except (UnicodeDecodeError, csv.Error):
            raise ParameterValueError("Cannot parse provided CSV file.")
        self.file.seek(0)
        return rows


PrimitiveAllowedTypes = Union[str, int, float, bool]
AllAllowedTypes = Union[str, int, float, bool, TextIO, None]
UserFacingTypes = Union[str, int, float, bool, CSVParameter]

ParamType = TypeVar("ParamType", bound=AllAllowedTypes)


class ParameterChoice(TypedDict):
    """A parameter choice containing the display name and value."""

    display_name: str
    value: PrimitiveAllowedTypes
