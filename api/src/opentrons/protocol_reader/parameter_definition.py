"""Parameter definition and associated validators."""

from typing import Generic, TypeVar, Optional, Sequence, Set, Union, get_args


# TODO these should inherit from shared_data exceptions
class ParameterValueError(ValueError):
    """An error raised when a parameter value is not valid."""


class ParameterDefinitionError(ValueError):
    """An error raised when a parameter definition value is not valid."""


AllowedTypes = Union[str, int, float, bool]
ParamType = TypeVar("ParamType", bound=AllowedTypes)


def _validate_default(default: ParamType, parameter_type: type) -> None:
    if not isinstance(default, parameter_type):
        raise ParameterValueError(
            f"Default parameter value has type {type(default)} must match type {parameter_type}"
        )


def _validate_choices(
    minimum: Optional[ParamType],
    maximum: Optional[ParamType],
    choices: Sequence[ParamType],
    parameter_type: type,
) -> None:
    if minimum is not None or maximum is not None:
        raise ParameterDefinitionError(
            "If choices are provided minimum and maximum values cannot be provided."
        )
    if any(not isinstance(choice, parameter_type) for choice in choices):
        raise ParameterDefinitionError(
            f"All choices provided must match type {type(parameter_type)}"
        )


def _validate_min_and_max(
    minimum: Optional[ParamType],
    maximum: Optional[ParamType],
    parameter_type: type,
) -> None:
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


def _validate_options(
    default: ParamType,
    minimum: Optional[ParamType],
    maximum: Optional[ParamType],
    choices: Optional[Sequence[ParamType]],
    parameter_type: type,
) -> None:
    _validate_default(default, parameter_type)

    if choices is None and minimum is None and maximum is None:
        raise ParameterDefinitionError(
            "Must provide either choices or a minimum and maximum value"
        )

    if choices is not None:
        _validate_choices(minimum, maximum, choices, parameter_type)
    else:
        _validate_min_and_max(minimum, maximum, parameter_type)


class ParameterDefinition(Generic[ParamType]):
    """The definition for a user defined parameter."""

    def __init__(
        self,
        display_name: str,
        variable_name: str,
        parameter_type: type,
        default: ParamType,
        minimum: Optional[ParamType] = None,
        maximum: Optional[ParamType] = None,
        choices: Optional[Sequence[ParamType]] = None,
    ) -> None:
        """Initializes a parameter.

        This stores the type, default values, range or list of possible values, and other information
        that is defined when a parameter is created for a protocol, as well as validators for setting
        a non-default value for the parameter.

        Arguments:
            display_name: The display name of the parameter as it would show up on the frontend.
            variable_name: The variable name the protocol will be referred to in the run context.
            parameter_type: Can be bool, int, float or str. Must match the type of default and all choices or
                min and max values
            default: The default value the parameter is set to. This will be used in initial analysis.
            minimum: The minimum value the parameter can be set to (inclusive). Mutually exclusive with choices.
            maximum: The maximum value the parameter can be set to (inclusive). Mutually exclusive with choices.
            choices: A sequence of possible choices that this parameter can be set to.
                Mutually exclusive with minimum and maximum.
        """
        self._display_name = display_name
        # TODO this needs to be validated that there are no spaces, special characters, etc
        self._variable_name = variable_name
        if parameter_type not in get_args(AllowedTypes):
            raise ParameterDefinitionError(
                "Parameters can only be of type int, float, str, or bool."
            )
        self._type = parameter_type

        self._allowed_values: Optional[Set[ParamType]] = None
        self._minimum: Optional[Union[int, float]] = None
        self._maximum: Optional[Union[int, float]] = None

        if self._type is bool:
            _validate_default(default, bool)
            if any(i is not None for i in [minimum, maximum, choices]):
                raise ParameterDefinitionError(
                    "Boolean parameters cannot have minimum, maximum or choices set."
                )

        else:
            _validate_options(default, minimum, maximum, choices, parameter_type)
            if choices is not None:
                self._allowed_values = set(choices)
            else:
                assert isinstance(minimum, (int, float)) and isinstance(
                    maximum, (int, float)
                )
                self._minimum = minimum
                self._maximum = maximum

        self._default: ParamType = default
        self._value: ParamType = default

    @property
    def value(self) -> ParamType:
        """The current value of the parameter."""
        return self._value

    @value.setter
    def value(self, new_value: ParamType) -> None:
        if self._type is bool and not isinstance(new_value, bool):
            raise ParameterValueError(
                "Parameter of type boolean can only be set to True or False."
            )
        elif self._allowed_values is not None and new_value not in self._allowed_values:
            raise ParameterValueError(
                f"Parameter must be set to one of the allowed values of {self._allowed_values}."
            )
        elif (
            isinstance(self._minimum, (int, float))
            and isinstance(self._maximum, (int, float))
            and isinstance(new_value, (int, float))
            and not (self._minimum <= new_value <= self._maximum)
        ):
            raise ParameterValueError(
                f"Parameter must be between {self._minimum} and {self._maximum} inclusive."
            )
        self._value = new_value
