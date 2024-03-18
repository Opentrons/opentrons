from typing import TypeVar, Union, TypedDict


AllowedTypes = Union[str, int, float, bool]

ParamType = TypeVar("ParamType", bound=AllowedTypes)


class ParameterChoices(TypedDict):
    """A parameter choice containing the display name and value."""

    display_name: str
    value: AllowedTypes


# TODO these should inherit from shared_data exceptions
class ParameterValueError(ValueError):
    """An error raised when a parameter value is not valid."""


class ParameterDefinitionError(ValueError):
    """An error raised when a parameter definition value is not valid."""


class ParameterNameError(ValueError):
    """An error raised when a parameter name or description is not valid."""
