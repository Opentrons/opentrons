from typing import TypeVar, Union, TypedDict


AllowedTypes = Union[str, int, float, bool]

ParamType = TypeVar("ParamType", bound=AllowedTypes)


class ParameterChoice(TypedDict):
    """A parameter choice containing the display name and value."""

    display_name: str
    value: AllowedTypes


class ParameterValueError(ValueError):
    """An error raised when a parameter value is not valid."""


class ParameterDefinitionError(ValueError):
    """An error raised when a parameter definition value is not valid."""


class ParameterNameError(ValueError):
    """An error raised when a parameter name or description is not valid."""
