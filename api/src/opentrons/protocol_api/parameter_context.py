"""Parameter context for python protocols."""

from typing import List, Dict

from .parameter_definition import ParameterDefinition
from .parameter_validation_and_errors import AllowedTypes


class ParameterContext:
    """Public context for adding parameters to a protocol."""

    def __init__(self) -> None:
        """Initializes a parameter context for user-set parameters."""
        self._parameters: List[ParameterDefinition[AllowedTypes]] = []

    def add_int(
        self,
        display_name: str,
        variable_name: str,
        default: int,
        minimum: int,
        maximum: int,
    ) -> None:
        """Creates an integer parameter, settable within a given range.

        Arguments:
            display_name: The display name of the int parameter as it would show up on the frontend.
            variable_name: The variable name the int parameter will be referred to in the run context.
            default: The default value the int parameter will be set to. This will be used in initial analysis.
            minimum: The minimum value the int parameter can be set to (inclusive).
            maximum: The maximum value the int parameter can be set to (inclusive).
        """
        self._parameters.append(
            ParameterDefinition(
                parameter_type=int,
                display_name=display_name,
                variable_name=variable_name,
                default=default,
                minimum=minimum,
                maximum=maximum,
            )
        )

    def add_bool(
        self,
        display_name: str,
        variable_name: str,
        default: bool,
    ) -> None:
        self._parameters.append(
            ParameterDefinition(
                parameter_type=bool,
                display_name=display_name,
                variable_name=variable_name,
                default=default,
            )
        )

    def get_variable_names_and_values(self) -> Dict[str, AllowedTypes]:
        """Returns all parameters in a dictionary with the variable name as the key and current value as the value."""
        return {
            parameter.variable_name: parameter.value for parameter in self._parameters
        }
