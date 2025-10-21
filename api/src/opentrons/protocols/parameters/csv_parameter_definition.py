"""CSV Parameter definition and associated classes/functions."""
from typing import Optional

from opentrons.protocol_engine.types import (
    RunTimeParameter,
    CSVParameter as ProtocolEngineCSVParameter,
    FileInfo,
)
from opentrons.protocols.api_support.types import APIVersion

from . import validation
from .parameter_definition import AbstractParameterDefinition
from .csv_parameter_interface import CSVParameter


class CSVParameterDefinition(AbstractParameterDefinition[Optional[bytes]]):
    """The definition for a user defined CSV file parameter."""

    def __init__(
        self, display_name: str, variable_name: str, description: Optional[str]
    ) -> None:
        """Initializes a CSV file parameter.

        Arguments:
            display_name: The display name of the parameter as it would show up on the frontend.
            variable_name: The variable name the parameter will be referred to in the run context.
            description: An optional description for the parameter.
        """
        self._display_name = validation.ensure_display_name(display_name)
        self._variable_name = validation.ensure_variable_name(variable_name)
        self._description = validation.ensure_description(description)
        self._value: Optional[bytes] = None
        self._file_info: Optional[FileInfo] = None

    @property
    def variable_name(self) -> str:
        """The in-protocol variable name of the parameter."""
        return self._variable_name

    @property
    def value(self) -> Optional[bytes]:
        """The current set file for the CSV parameter. Defaults to None on definition creation."""
        return self._value

    @value.setter
    def value(self, contents: bytes) -> None:
        self._value = contents

    @property
    def file_info(self) -> Optional[FileInfo]:
        return self._file_info

    @file_info.setter
    def file_info(self, file_info: FileInfo) -> None:
        self._file_info = file_info

    def as_csv_parameter_interface(self, api_version: APIVersion) -> CSVParameter:
        return CSVParameter(contents=self._value, api_version=api_version)

    def as_protocol_engine_type(self) -> RunTimeParameter:
        """Returns CSV parameter as a Protocol Engine type to send to client."""
        return ProtocolEngineCSVParameter(
            displayName=self._display_name,
            variableName=self._variable_name,
            description=self._description,
            file=self._file_info,
        )


def create_csv_parameter(
    display_name: str,
    variable_name: str,
    description: Optional[str] = None,
) -> CSVParameterDefinition:
    return CSVParameterDefinition(
        display_name=display_name, variable_name=variable_name, description=description
    )
