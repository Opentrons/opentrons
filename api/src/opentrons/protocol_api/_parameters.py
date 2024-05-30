from typing import Dict, Optional, Any

from opentrons.protocols.parameters.types import AllAllowedTypes, ParameterNameError


class Parameters:
    def __init__(self, parameters: Optional[Dict[str, AllAllowedTypes]] = None) -> None:
        super().__setattr__("_values", {})
        self._values: Dict[str, AllAllowedTypes] = {}
        if parameters is not None:
            for name, value in parameters.items():
                self._initialize_parameter(name, value)

    def __setattr__(self, key: str, value: Any) -> None:
        if key in self._values:
            raise AttributeError(f"Cannot overwrite protocol defined parameter {key}")
        super().__setattr__(key, value)

    def _initialize_parameter(self, variable_name: str, value: AllAllowedTypes) -> None:
        if not hasattr(self, variable_name):
            setattr(self, variable_name, value)
            self._values[variable_name] = value
        else:
            raise ParameterNameError(
                f"Cannot use {variable_name} as a variable name, either duplicates another"
                f" parameter name, Opentrons reserved function, or Python built-in"
            )

    def get_all(self) -> Dict[str, AllAllowedTypes]:
        return self._values
