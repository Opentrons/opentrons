"""Parameter definition and associated validators."""
from abc import abstractmethod, ABC
from typing import Generic, Optional, List, Set, Union

from opentrons.protocols.parameters.types import (
    ParamType,
    ParameterChoice,
    PrimitiveAllowedTypes,
)
from opentrons.protocols.parameters.exceptions import (
    ParameterValueError,
    ParameterDefinitionError,
)
from opentrons.protocols.parameters import validation
from opentrons.protocol_engine.types import (
    RunTimeParameter,
    NumberParameter,
    BooleanParameter,
    EnumParameter,
    EnumChoice,
)
from opentrons.util.get_union_elements import get_union_elements


class AbstractParameterDefinition(ABC, Generic[ParamType]):
    @property
    @abstractmethod
    def variable_name(self) -> str:
        ...

    @property
    @abstractmethod
    def value(self) -> ParamType:
        ...

    @value.setter
    @abstractmethod
    def value(self, new_value: ParamType) -> None:
        ...

    @abstractmethod
    def as_protocol_engine_type(self) -> RunTimeParameter:
        ...


class ParameterDefinition(AbstractParameterDefinition[PrimitiveAllowedTypes]):
    """The definition for a user defined parameter."""

    def __init__(
        self,
        display_name: str,
        variable_name: str,
        parameter_type: type,
        default: PrimitiveAllowedTypes,
        minimum: Optional[PrimitiveAllowedTypes] = None,
        maximum: Optional[PrimitiveAllowedTypes] = None,
        choices: Optional[List[ParameterChoice]] = None,
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
        self._display_name = validation.ensure_display_name(display_name)
        self._variable_name = validation.ensure_variable_name(variable_name)
        self._description = validation.ensure_description(description)
        self._unit = validation.ensure_unit_string_length(unit)

        if parameter_type not in get_union_elements(PrimitiveAllowedTypes):
            raise ParameterDefinitionError(
                "Parameters can only be of type int, float, str, or bool."
            )
        self._type = parameter_type

        self._choices: Optional[List[ParameterChoice]] = choices
        self._allowed_values: Optional[Set[PrimitiveAllowedTypes]] = None

        self._minimum: Optional[Union[int, float]] = None
        self._maximum: Optional[Union[int, float]] = None

        validation.validate_options(default, minimum, maximum, choices, parameter_type)
        if choices is not None:
            self._allowed_values = {choice["value"] for choice in choices}
        else:
            assert isinstance(minimum, (int, float)) and isinstance(
                maximum, (int, float)
            )
            self._minimum = minimum
            self._maximum = maximum

        self._default: PrimitiveAllowedTypes = default
        self.value: PrimitiveAllowedTypes = default

    @property
    def value(self) -> PrimitiveAllowedTypes:
        """The current value of the parameter."""
        return self._value

    @value.setter
    def value(self, new_value: PrimitiveAllowedTypes) -> None:
        validation.validate_type(new_value, self._type)
        if self._allowed_values is not None and new_value not in self._allowed_values:
            raise ParameterValueError(
                f"Parameter must be set to one of the allowed values of {sorted(self._allowed_values)}."
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

    @property
    def parameter_type(self) -> type:
        """The python type of the parameter."""
        return self._type

    def as_protocol_engine_type(self) -> RunTimeParameter:
        """Returns parameter as a Protocol Engine type to send to client."""
        parameter: RunTimeParameter
        if self._type is bool:
            parameter = BooleanParameter(
                displayName=self._display_name,
                variableName=self._variable_name,
                description=self._description,
                value=bool(self._value),
                default=bool(self._default),
            )
        elif self._choices is not None:
            choices = [
                EnumChoice(
                    displayName=str(choice["display_name"]),
                    value=choice["value"],
                )
                for choice in self._choices
            ]
            parameter = EnumParameter(
                type=validation.convert_type_string_for_enum(self._type),
                displayName=self._display_name,
                variableName=self._variable_name,
                description=self._description,
                choices=choices,
                value=self._value,
                default=self._default,
            )
        elif self._minimum is not None and self._maximum is not None:
            parameter = NumberParameter(
                type=validation.convert_type_string_for_num_param(self._type),
                displayName=self._display_name,
                variableName=self._variable_name,
                description=self._description,
                suffix=self._unit,
                min=float(self._minimum),
                max=float(self._maximum),
                value=float(self._value),
                default=float(self._default),
            )
        else:
            raise ParameterDefinitionError(
                f"Cannot resolve parameter {self._display_name} to protocol engine type."
            )

        return parameter


def create_int_parameter(
    display_name: str,
    variable_name: str,
    default: int,
    minimum: Optional[int] = None,
    maximum: Optional[int] = None,
    choices: Optional[List[ParameterChoice]] = None,
    description: Optional[str] = None,
    unit: Optional[str] = None,
) -> ParameterDefinition:
    """Creates an integer parameter."""
    return ParameterDefinition(
        parameter_type=int,
        display_name=display_name,
        variable_name=variable_name,
        default=default,
        minimum=minimum,
        maximum=maximum,
        choices=choices,
        description=description,
        unit=unit,
    )


def create_float_parameter(
    display_name: str,
    variable_name: str,
    default: float,
    minimum: Optional[float] = None,
    maximum: Optional[float] = None,
    choices: Optional[List[ParameterChoice]] = None,
    description: Optional[str] = None,
    unit: Optional[str] = None,
) -> ParameterDefinition:
    """Creates a float parameter."""
    return ParameterDefinition(
        parameter_type=float,
        display_name=display_name,
        variable_name=variable_name,
        default=default,
        minimum=minimum,
        maximum=maximum,
        choices=choices,
        description=description,
        unit=unit,
    )


def create_bool_parameter(
    display_name: str,
    variable_name: str,
    default: bool,
    choices: List[ParameterChoice],
    description: Optional[str] = None,
) -> ParameterDefinition:
    """Creates a boolean parameter."""
    return ParameterDefinition(
        parameter_type=bool,
        display_name=display_name,
        variable_name=variable_name,
        default=default,
        choices=choices,
        description=description,
    )


def create_str_parameter(
    display_name: str,
    variable_name: str,
    default: str,
    choices: Optional[List[ParameterChoice]] = None,
    description: Optional[str] = None,
) -> ParameterDefinition:
    """Creates a string parameter."""
    return ParameterDefinition(
        parameter_type=str,
        display_name=display_name,
        variable_name=variable_name,
        default=default,
        choices=choices,
        description=description,
    )
