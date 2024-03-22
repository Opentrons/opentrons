"""Parameter context for python protocols."""

from typing import List, Optional, Union

from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.parameters import parameter_definition
from opentrons.protocols.parameters.types import ParameterChoice

from ._parameters import Parameters

_ParameterDefinitionTypes = Union[
    parameter_definition.ParameterDefinition[int],
    parameter_definition.ParameterDefinition[bool],
    parameter_definition.ParameterDefinition[float],
    parameter_definition.ParameterDefinition[str],
]


class ParameterContext:
    """Public context for adding parameters to a protocol."""

    def __init__(self, api_version: APIVersion) -> None:
        """Initializes a parameter context for user-set parameters."""
        self._api_version = api_version
        self._parameters: List[_ParameterDefinitionTypes] = []

    def add_int(
        self,
        display_name: str,
        variable_name: str,
        default: int,
        minimum: Optional[int] = None,
        maximum: Optional[int] = None,
        choices: Optional[List[ParameterChoice]] = None,
        description: Optional[str] = None,
        unit: Optional[str] = None,
    ) -> None:
        """Creates an integer parameter, settable within a given range or list of choices.

        Arguments:
            display_name: The display name of the int parameter as it would show up on the frontend.
            variable_name: The variable name the int parameter will be referred to in the run context.
            default: The default value the int parameter will be set to. This will be used in initial analysis.
            minimum: The minimum value the int parameter can be set to (inclusive). Mutually exclusive with choices.
            maximum: The maximum value the int parameter can be set to (inclusive). Mutually exclusive with choices.
            choices: A list of possible choices that this parameter can be set to.
                Mutually exclusive with minimum and maximum.
            description: A description of the parameter as it will show up on the frontend.
            unit: An optional unit to be appended to the end of the integer as it shown on the frontend.
        """
        self._parameters.append(
            parameter_definition.create_int_parameter(
                display_name=display_name,
                variable_name=variable_name,
                default=default,
                minimum=minimum,
                maximum=maximum,
                choices=choices,
                description=description,
                unit=unit,
            )
        )

    def add_float(
        self,
        display_name: str,
        variable_name: str,
        default: float,
        minimum: Optional[float] = None,
        maximum: Optional[float] = None,
        choices: Optional[List[ParameterChoice]] = None,
        description: Optional[str] = None,
        unit: Optional[str] = None,
    ) -> None:
        """Creates a float parameter, settable within a given range or list of choices.

        Arguments:
            display_name: The display name of the float parameter as it would show up on the frontend.
            variable_name: The variable name the float parameter will be referred to in the run context.
            default: The default value the float parameter will be set to. This will be used in initial analysis.
            minimum: The minimum value the float parameter can be set to (inclusive). Mutually exclusive with choices.
            maximum: The maximum value the float parameter can be set to (inclusive). Mutually exclusive with choices.
            choices: A list of possible choices that this parameter can be set to.
                Mutually exclusive with minimum and maximum.
            description: A description of the parameter as it will show up on the frontend.
            unit: An optional unit to be appended to the end of the float as it shown on the frontend.
        """
        self._parameters.append(
            parameter_definition.create_float_parameter(
                display_name=display_name,
                variable_name=variable_name,
                default=default,
                minimum=minimum,
                maximum=maximum,
                choices=choices,
                description=description,
                unit=unit,
            )
        )

    def add_bool(
        self,
        display_name: str,
        variable_name: str,
        default: bool,
        description: Optional[str] = None,
    ) -> None:
        """Creates a boolean parameter with allowable values of "On" (True) or "Off" (False).

        Arguments:
            display_name: The display name of the boolean parameter as it would show up on the frontend.
            variable_name: The variable name the boolean parameter will be referred to in the run context.
            default: The default value the boolean parameter will be set to. This will be used in initial analysis.
            description: A description of the parameter as it will show up on the frontend.
        """
        self._parameters.append(
            parameter_definition.create_bool_parameter(
                display_name=display_name,
                variable_name=variable_name,
                default=default,
                choices=[
                    {"display_name": "On", "value": True},
                    {"display_name": "Off", "value": False},
                ],
                description=description,
            )
        )

    def add_str(
        self,
        display_name: str,
        variable_name: str,
        default: str,
        choices: Optional[List[ParameterChoice]] = None,
        description: Optional[str] = None,
    ) -> None:
        """Creates a string parameter, settable among given choices.

        Arguments:
            display_name: The display name of the string parameter as it would show up on the frontend.
            variable_name: The variable name the string parameter will be referred to in the run context.
            default: The default value the string parameter will be set to. This will be used in initial analysis.
            choices: A list of possible choices that this parameter can be set to.
                Mutually exclusive with minimum and maximum.
            description: A description of the parameter as it will show up on the frontend.
        """
        self._parameters.append(
            parameter_definition.create_str_parameter(
                display_name=display_name,
                variable_name=variable_name,
                default=default,
                choices=choices,
                description=description,
            )
        )

    def export_parameters(self) -> Parameters:
        """Exports all parameters into a protocol run usable parameters object.

        :meta private:

        This is intended for Opentrons internal use only and is not a guaranteed API.
        """
        return Parameters(
            parameters={
                parameter.variable_name: parameter.value
                for parameter in self._parameters
            }
        )
