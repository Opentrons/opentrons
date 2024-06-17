import csv
from typing import TypeVar, Union, TypedDict, TextIO, Optional, List, Sequence, Dict

from opentrons_shared_data.errors.codes import ErrorCodes
from opentrons_shared_data.errors.exceptions import GeneralError, EnumeratedError


class FileParameterRequired(GeneralError):
    """Insert real error text here"""

    def __init__(
        self,
        message: Optional[str] = None,
        detail: Optional[Dict[str, str]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build an InvalidStoredData."""
        super().__init__(ErrorCodes.FILE_PARAMETER_REQUIRED, message, detail, wrapping)


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
            raise FileParameterRequired("CSV Parameter needs to be set to a file for full analysis.")
        return self._file

    def rows(self) -> List[List[str]]:
        if self._file is None:
            raise FileParameterRequired("CSV Parameter needs to be set to a file for full analysis.")
        return self._rows


PrimitiveAllowedTypes = Union[str, int, float, bool]
AllAllowedTypes = Union[str, int, float, bool, TextIO, None]
UserFacingTypes = Union[str, int, float, bool, CSVParameter]

ParamType = TypeVar("ParamType", bound=AllAllowedTypes)


class ParameterChoice(TypedDict):
    """A parameter choice containing the display name and value."""

    display_name: str
    value: PrimitiveAllowedTypes


class ParameterValueError(ValueError):
    """An error raised when a parameter value is not valid."""


class ParameterDefinitionError(ValueError):
    """An error raised when a parameter definition value is not valid."""


class ParameterNameError(ValueError):
    """An error raised when a parameter name or description is not valid."""
