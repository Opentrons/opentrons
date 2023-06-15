"""Script to write pipette serial numbers to eeprom files.

This script is configured to run against the emulation container.
High level overview of the script:

- Read pipette definition from environment variables
- Generate pipette serial code
- Write pipette serial code to eeprom file
- Profit
"""

import os
import json
from dataclasses import dataclass
from typing import Optional
from opentrons_hardware.firmware_bindings.constants import PipetteName
from opentrons_hardware.instruments.pipettes.serials import serial_val_from_parts

LEFT_PIPETTE_ENV_VAR_NAME = "LEFT_OT3_PIPETTE_DEFINITION"
RIGHT_PIPETTE_ENV_VAR_NAME = "RIGHT_OT3_PIPETTE_DEFINITION"


@dataclass
class OT3PipetteEnvVar:
    """OT3 Pipette Environment Variable."""

    pipette_name: PipetteName
    pipette_model: int
    pipette_serial_code: bytes
    eeprom_file_path: str

    @classmethod
    def from_json_string(cls, env_var_string: str) -> "OT3PipetteEnvVar":
        """Create OT3PipetteEnvVar from json string."""
        env_var = json.loads(env_var_string)
        return cls(
            pipette_name=PipetteName[env_var["pipette_name"]],
            pipette_model=env_var["pipette_model"],
            pipette_serial_code=env_var["pipette_serial_code"].encode("utf-8"),
            eeprom_file_path=env_var["eeprom_file_path"],
        )

    def _generate_serial_code(self) -> bytes:
        """Generate serial code."""
        return serial_val_from_parts(
            self.pipette_name, self.pipette_model, self.pipette_serial_code
        )

    def generate_eeprom_file(self) -> None:
        """Generate eeprom file for pipette."""
        with open(self.eeprom_file_path, "wb") as f:
            f.write(self._generate_serial_code())


def _get_env_var(env_var_name: str) -> str:
    """Check that environment variable is set."""
    env_var_value: Optional[str] = os.environ.get(env_var_name)
    if env_var_value is None:
        raise ValueError(
            f"Environment variable {env_var_name} is not set. "
            "Please set this environment variable and try again."
        )
    return env_var_value


def main() -> None:
    """Main function."""
    left_pipette_json_string = _get_env_var(LEFT_PIPETTE_ENV_VAR_NAME)
    right_pipette_json_string = _get_env_var(RIGHT_PIPETTE_ENV_VAR_NAME)

    OT3PipetteEnvVar.from_json_string(left_pipette_json_string).generate_eeprom_file()
    OT3PipetteEnvVar.from_json_string(right_pipette_json_string).generate_eeprom_file()


if __name__ == "__main__":
    main()
