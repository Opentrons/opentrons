from typing import Dict, Optional

from opentrons.protocol_api.parameter_validation_and_errors import AllowedTypes


class Parameters:
    def __init__(self, parameters: Optional[Dict[str, AllowedTypes]] = None) -> None:
        self._values: Dict[str, AllowedTypes] = {}
        if parameters is not None:
            for name, value in parameters.items():
                self._set_parameter(name, value)

    def _set_parameter(self, variable_name: str, value: AllowedTypes) -> None:
        # TODO raise an error if the variable name already exists to prevent overwriting anything important
        if not hasattr(self, variable_name):
            setattr(self, variable_name, value)
            self._values[variable_name] = value

    def get_all(self) -> Dict[str, AllowedTypes]:
        return self._values
