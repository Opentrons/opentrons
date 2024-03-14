"""Parameter definition and associated validators."""

from typing import Generic, Optional, List, Set, Union, get_args


from .parameter_validation_and_errors import (
    ParamType,
    ParameterChoices,
    AllowedTypes,
    ParameterDefinitionError,
    ParameterValueError,
    validate_options,
)


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
        choices: Optional[List[ParameterChoices]] = None,
        description: Optional[str] = None,
        unit: Optional[str] = None,
    ) -> None:
        """Initializes a parameter.

        This stores the type, default values, range or list of possible values, and other information
        that is defined when a parameter is created for a protocol, as well as validators for setting
        a non-default value for the parameter.

        Arguments:
            display_name: The display name of the parameter as it would show up on the frontend.
            variable_name: The variable name the parameter will be referred to in the run context.
            parameter_type: Can be bool, int, float or str. Must match the type of default and all choices or
                min and max values
            default: The default value the parameter is set to. This will be used in initial analysis.
            minimum: The minimum value the parameter can be set to (inclusive). Mutually exclusive with choices.
            maximum: The maximum value the parameter can be set to (inclusive). Mutually exclusive with choices.
            choices: A sequence of possible choices that this parameter can be set to.
                Mutually exclusive with minimum and maximum.
            description: An optional description for the parameter.
            unit: An optional suffix for float and int type parameters.
        """
        self._display_name = display_name
        # TODO this needs to be validated that there are no spaces, special characters, etc
        self._variable_name = variable_name
        self._description = description
        self._unit = unit

        if parameter_type not in get_args(AllowedTypes):
            raise ParameterDefinitionError(
                "Parameters can only be of type int, float, str, or bool."
            )
        self._type = parameter_type

        self._choices: Optional[List[ParameterChoices]] = choices
        self._allowed_values: Optional[Set[AllowedTypes]] = None

        self._minimum: Optional[Union[int, float]] = None
        self._maximum: Optional[Union[int, float]] = None

        validate_options(default, minimum, maximum, choices, parameter_type)
        if choices is not None:
            self._allowed_values = {choice["value"] for choice in choices}
        else:
            assert isinstance(minimum, (int, float)) and isinstance(
                maximum, (int, float)
            )
            self._minimum = minimum
            self._maximum = maximum

        self._default: ParamType = default
        self.value: ParamType = default

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

    @property
    def variable_name(self) -> str:
        """The in-protocol variable name of the parameter."""
        return self._variable_name
