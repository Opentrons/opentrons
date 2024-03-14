from typing import List, Optional, TypeVar, Union, TypedDict


# TODO these should inherit from shared_data exceptions
class ParameterValueError(ValueError):
    """An error raised when a parameter value is not valid."""


class ParameterDefinitionError(ValueError):
    """An error raised when a parameter definition value is not valid."""


class ParameterNameError(ValueError):
    """An error raised when a parameter name or description is not valid."""


AllowedTypes = Union[str, int, float, bool]
ParamType = TypeVar("ParamType", bound=AllowedTypes)
DISPLAY_NAME_MAX_LEN = 30


class ParameterChoices(TypedDict):
    """A parameter choice containing the display name and value."""

    display_name: str
    value: AllowedTypes


def _validate_default(default: ParamType, parameter_type: type) -> None:
    """Validate default parameter is the correct type."""
    if not isinstance(default, parameter_type):
        raise ParameterValueError(
            f"Default parameter value has type {type(default)} must match type {parameter_type}."
        )


def _validate_display_name(display_name: str) -> None:
    """Validate display name is within the character limit."""
    if len(display_name) > DISPLAY_NAME_MAX_LEN:
        raise ParameterNameError(
            f"Display name {display_name} greater than {DISPLAY_NAME_MAX_LEN} characters."
        )


def _validate_choices(
    minimum: Optional[ParamType],
    maximum: Optional[ParamType],
    choices: List[ParameterChoices],
    parameter_type: type,
) -> None:
    """Validate that min and max is not defined and all choices are properly formatted."""
    if minimum is not None or maximum is not None:
        raise ParameterDefinitionError(
            "If choices are provided minimum and maximum values cannot be provided."
        )
    for choice in choices:
        try:
            display_name = choice["display_name"]
            value = choice["value"]
        except KeyError:
            raise ParameterDefinitionError(
                "All choices must be a dictionary with keys 'display_name' and 'value'."
            )
        _validate_display_name(display_name)
        if not isinstance(value, parameter_type):
            raise ParameterDefinitionError(
                f"All choices provided must match type {type(parameter_type)}"
            )


def _validate_min_and_max(
    minimum: Optional[ParamType],
    maximum: Optional[ParamType],
    parameter_type: type,
) -> None:
    """Validate the minium and maximum are both defined, the same type, and a valid range."""
    if minimum is not None and maximum is None:
        raise ParameterDefinitionError(
            "If a minimum value is provided a maximum must also be provided."
        )
    elif maximum is not None and minimum is None:
        raise ParameterDefinitionError(
            "If a maximum value is provided a minimum must also be provided."
        )
    elif maximum is not None and minimum is not None:
        if isinstance(maximum, (int, float)) and isinstance(minimum, (int, float)):
            if maximum <= minimum:
                raise ParameterDefinitionError(
                    "Maximum must be greater than the minimum"
                )

            if not isinstance(minimum, parameter_type) or not isinstance(
                maximum, parameter_type
            ):
                raise ParameterDefinitionError(
                    f"Minimum and maximum must match type {parameter_type}"
                )
        else:
            raise ParameterDefinitionError(
                "Only parameters of type float or int can have a minimum and maximum"
            )


def validate_options(
    default: ParamType,
    minimum: Optional[ParamType],
    maximum: Optional[ParamType],
    choices: Optional[List[ParameterChoices]],
    parameter_type: type,
) -> None:
    """Validate default values and all possible constraints for a valid parameter definition."""
    _validate_default(default, parameter_type)

    if choices is None and minimum is None and maximum is None:
        raise ParameterDefinitionError(
            "Must provide either choices or a minimum and maximum value"
        )

    if choices is not None:
        _validate_choices(minimum, maximum, choices, parameter_type)
    else:
        _validate_min_and_max(minimum, maximum, parameter_type)
