from typing import Dict, Optional, Any

from opentrons.protocols.parameters.types import AllowedTypes, ParameterNameError


class Parameters:
    def __init__(self, parameters: Optional[Dict[str, AllowedTypes]] = None) -> None:
        self._values: Dict[str, AllowedTypes] = {}
        if parameters is not None:
            for name, value in parameters.items():
                self._initialize_parameter(name, value)

    def _getparam(self, variable_name: str) -> Any:
        return self._values[variable_name]

    def _initialize_parameter(self, variable_name: str, value: AllowedTypes) -> None:
        if not hasattr(self, variable_name):
            self._values[variable_name] = value
            prop = property(
                fget=lambda s, v=variable_name: Parameters._getparam(s, v)  # type: ignore[misc]
            )
            setattr(Parameters, variable_name, prop)
        else:
            raise ParameterNameError(
                f"Cannot use {variable_name} as a variable name, either duplicates another"
                f" parameter name, Opentrons reserved function, or Python built-in"
            )

    def get_all(self) -> Dict[str, AllowedTypes]:
        return self._values
