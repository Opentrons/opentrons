import keyword
from typing import List, Set, Optional, Union, Literal

from .exceptions import (
    ParameterValueError,
    ParameterDefinitionError,
    ParameterNameError,
)
from .types import (
    PrimitiveAllowedTypes,
    ParamType,
    ParameterChoice,
)

UNIT_MAX_LEN = 10
DISPLAY_NAME_MAX_LEN = 30
DESCRIPTION_MAX_LEN = 100


def validate_variable_name_unique(
    variable_name: str, other_variable_names: Set[str]
) -> None:
    """Validate that the given variable name is unique."""
    if isinstance(variable_name, str) and variable_name in other_variable_names:
        raise ParameterNameError(
            f'"{variable_name}" is already defined as a variable name for another parameter.'
            f" All variable names must be unique."
        )


def ensure_display_name(display_name: str) -> str:
    """Validate display name is within the character limit."""
    if not isinstance(display_name, str):
        raise ParameterNameError(
            f"Display name must be a string and at most {DISPLAY_NAME_MAX_LEN} characters."
        )
    if len(display_name) > DISPLAY_NAME_MAX_LEN:
        raise ParameterNameError(
            f'Display name "{display_name}" greater than {DISPLAY_NAME_MAX_LEN} characters.'
        )
    return display_name


def ensure_variable_name(variable_name: str) -> str:
    """Validate variable name is a valid python variable name."""
    if not isinstance(variable_name, str):
        raise ParameterNameError("Variable name must be a string.")
    if not variable_name.isidentifier():
        raise ParameterNameError(
            "Variable name must only contain alphanumeric characters, underscores, and cannot start with a digit."
        )
    if keyword.iskeyword(variable_name):
        raise ParameterNameError("Variable name cannot be a reserved Python keyword.")
    return variable_name


def ensure_description(description: Optional[str]) -> Optional[str]:
    """Validate description is within the character limit."""
    if description is not None:
        if not isinstance(description, str):
            raise ParameterNameError(
                f"Description must be a string and at most {DESCRIPTION_MAX_LEN} characters."
            )
        if len(description) > DESCRIPTION_MAX_LEN:
            raise ParameterNameError(
                f'Description "{description}" greater than {DESCRIPTION_MAX_LEN} characters.'
            )
    return description


def ensure_unit_string_length(unit: Optional[str]) -> Optional[str]:
    """Validate unit is within the character limit."""
    if unit is not None:
        if not isinstance(unit, str):
            raise ParameterNameError(
                f"Unit must be a string and at most {UNIT_MAX_LEN} characters."
            )
        if len(unit) > UNIT_MAX_LEN:
            raise ParameterNameError(
                f'Unit "{unit}" greater than {UNIT_MAX_LEN} characters.'
            )
    return unit


def ensure_value_type(
    value: Union[float, bool, str], parameter_type: type
) -> PrimitiveAllowedTypes:
    """Ensures that the value type coming in from the client matches the given type.

    This does not guarantee that the value will be the correct type for the given parameter, only that any data coming
    in is in the format that we expect. For now, the only transformation it is doing is converting integers represented
    as floating points to integers, and bools represented as 1.0/0.0 to True/False, and floating points represented as
    ints to floats.

    If something is labelled as a type but does not get converted here, that will be caught when it is attempted to be
    set as the parameter value and will raise the appropriate error there.
    """
    validated_value: PrimitiveAllowedTypes = value
    if isinstance(value, float):
        if parameter_type is bool and (value == 0 or value == 1):
            validated_value = bool(value)
        elif parameter_type is int and value.is_integer():
            validated_value = int(value)
    elif (
        isinstance(value, int)
        and not isinstance(value, bool)
        and parameter_type is float
    ):
        validated_value = float(value)
    return validated_value


def ensure_float_value(value: Union[float, int]) -> float:
    """Ensures that if we are expecting a float and receive an int, that will be converted to a float."""
    if not isinstance(value, bool) and isinstance(value, int):
        return float(value)
    return value


def ensure_optional_float_value(value: Optional[Union[float, int]]) -> Optional[float]:
    """Ensures that if we are expecting an optional float and receive an int, that will be converted to a float."""
    if not isinstance(value, bool) and isinstance(value, int):
        return float(value)
    return value


def ensure_float_choices(
    choices: Optional[List[ParameterChoice]],
) -> Optional[List[ParameterChoice]]:
    """Ensures that if we are expecting float parameter choices and any are int types, those will be converted."""
    if choices is not None:
        return [
            ParameterChoice(
                display_name=choice["display_name"],
                # Type ignore because if for some reason this is a str or bool, that will raise in `validate_options`
                value=ensure_float_value(choice["value"]),  # type: ignore[arg-type]
            )
            for choice in choices
        ]
    return choices


def convert_type_string_for_enum(
    parameter_type: type,
) -> Literal["int", "float", "str"]:
    """Converts a type object into a string for an enumerated parameter."""
    if parameter_type is int:
        return "int"
    elif parameter_type is float:
        return "float"
    elif parameter_type is str:
        return "str"
    else:
        raise ParameterValueError(
            f"Cannot resolve parameter type '{parameter_type.__name__}' for an enumerated parameter."
        )


def convert_type_string_for_num_param(parameter_type: type) -> Literal["int", "float"]:
    """Converts a type object into a string for a number parameter."""
    if parameter_type is int:
        return "int"
    elif parameter_type is float:
        return "float"
    else:
        raise ParameterValueError(
            f"Cannot resolve parameter type '{parameter_type.__name__}' for a number parameter."
        )


def _validate_choices(
    minimum: Optional[ParamType],
    maximum: Optional[ParamType],
    choices: List[ParameterChoice],
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
        ensure_display_name(display_name)
        if not isinstance(value, parameter_type):
            raise ParameterDefinitionError(
                f"All choices provided must be of type '{parameter_type.__name__}'"
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
        if parameter_type is int or parameter_type is float:
            if not isinstance(minimum, parameter_type):
                raise ParameterDefinitionError(
                    f"Minimum is type '{type(minimum).__name__}',"
                    f" but must be of parameter type '{parameter_type.__name__}'"
                )
            if not isinstance(maximum, parameter_type):
                raise ParameterDefinitionError(
                    f"Maximum is type '{type(maximum).__name__}',"
                    f" but must be of parameter type '{parameter_type.__name__}'"
                )
            # These asserts are for the type checker and should never actually be asserted false
            assert isinstance(minimum, (int, float))
            assert isinstance(maximum, (int, float))
            if maximum < minimum:
                raise ParameterDefinitionError(
                    "Maximum must be greater than the minimum"
                )
        else:
            raise ParameterDefinitionError(
                "Only parameters of type float or int can have a minimum and maximum."
            )


def validate_type(value: ParamType, parameter_type: type) -> None:
    """Validate parameter value is the correct type."""
    if not isinstance(value, parameter_type):
        raise ParameterValueError(
            f"Parameter value {value!r} has type '{type(value).__name__}',"
            f" but must be of type '{parameter_type.__name__}'."
        )


def validate_options(
    default: ParamType,
    minimum: Optional[ParamType],
    maximum: Optional[ParamType],
    choices: Optional[List[ParameterChoice]],
    parameter_type: type,
) -> None:
    """Validate default values and all possible constraints for a valid parameter definition."""
    if not isinstance(default, parameter_type):
        raise ParameterValueError(
            f"Parameter default {default!r} has type '{type(default).__name__}',"
            f" but must be of type '{parameter_type.__name__}'."
        )

    if choices is None and minimum is None and maximum is None:
        raise ParameterDefinitionError(
            "Must provide either choices or a minimum and maximum value"
        )

    if choices is not None:
        _validate_choices(minimum, maximum, choices, parameter_type)
    else:
        _validate_min_and_max(minimum, maximum, parameter_type)
