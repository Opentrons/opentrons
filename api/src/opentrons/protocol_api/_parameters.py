from typing import Dict, Optional, Any

from opentrons.protocols.parameters.types import AllowedTypes


class Parameters:
    def __init__(self, parameters: Optional[Dict[str, AllowedTypes]] = None) -> None:
        self._values: Dict[str, AllowedTypes] = {}
        if parameters is not None:
            for name, value in parameters.items():
                self._initialize_parameter(name, value)

    def _getparam(self, variable_name: str) -> Any:
        return getattr(self, f"_{variable_name}")

    def _initialize_parameter(self, variable_name: str, value: AllowedTypes) -> None:
        # TODO raise an error if the variable name already exists to prevent overwriting anything important
        if not hasattr(self, variable_name) and not hasattr(self, f"_{variable_name}"):
            setattr(self, f"_{variable_name}", value)
            prop = property(
                fget=lambda s, v=variable_name: Parameters._getparam(s, v)  # type: ignore[misc]
            )
            setattr(Parameters, variable_name, prop)
            self._values[variable_name] = value

    def get_all(self) -> Dict[str, AllowedTypes]:
        return self._values
