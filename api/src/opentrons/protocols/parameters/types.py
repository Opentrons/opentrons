import csv
from typing import TypeVar, Union, TypedDict, TextIO, Optional, List

from .exceptions import RuntimeParameterRequired


class CSVParameter:
    def __init__(self, csv_file: Optional[TextIO]) -> None:
        self._file = csv_file
        self._rows = []
        if self._file is not None:
            for row in csv.reader(self._file):
                self._rows.append(row)
            self._file.seek(0)

    @property
    def file(self) -> TextIO:
        if self._file is None:
            raise RuntimeParameterRequired(
                "CSV parameter needs to be set to a file for full analysis or run."
            )
        return self._file

    def rows(self) -> List[List[str]]:
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
