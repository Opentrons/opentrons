from typing import TypeVar, Union, TypedDict, TextIO


PrimitiveAllowedTypes = Union[str, int, float, bool]
AllAllowedTypes = Union[str, int, float, bool, TextIO, None]

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
