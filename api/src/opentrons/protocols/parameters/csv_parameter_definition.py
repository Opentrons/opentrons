"""CSV Parameter definition and associated classes/functions."""
from typing import Optional, TextIO

from opentrons.protocol_engine.types import RunTimeParameter, CSVParameter, FileId

from . import validation
from .parameter_definition import AbstractParameterDefinition
from .types import ParameterDefinitionError


class CSVParameterDefinition(AbstractParameterDefinition[Optional[TextIO]]):
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
        self._value: Optional[TextIO] = None
        self._id: Optional[str] = None

    @property
    def variable_name(self) -> str:
        """The in-protocol variable name of the parameter."""
        return self._variable_name

    @property
    def value(self) -> Optional[TextIO]:
        """The current set file for the CSV parameter. Defaults to None on definition creation."""
        return self._value

    @value.setter
    def value(self, new_file: TextIO) -> None:
        if not new_file.name.endswith(".csv"):
            raise ParameterDefinitionError(
                f"CSV parameter {self._variable_name} was given non csv file {new_file.name}"
            )
        self._value = new_file

    @property
    def id(self) -> Optional[str]:
        return self._id

    @id.setter
    def id(self, uuid: str) -> None:
        self._id = uuid

    def as_protocol_engine_type(self) -> RunTimeParameter:
        """Returns CSV parameter as a Protocol Engine type to send to client."""
        return CSVParameter(
            displayName=self._display_name,
            variableName=self._variable_name,
            description=self._description,
            file=FileId(id=self._id) if self._id is not None else None,
        )


def create_csv_parameter(
    display_name: str,
    variable_name: str,
    description: Optional[str] = None,
) -> CSVParameterDefinition:
    return CSVParameterDefinition(
        display_name=display_name, variable_name=variable_name, description=description
    )
