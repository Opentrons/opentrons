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
from typing_extensions import Literal
from opentrons_hardware.firmware_bindings.constants import PipetteName
from opentrons_hardware.instruments.pipettes.serials import serial_val_from_parts

LEFT_PIPETTE_ENV_VAR_NAME = "LEFT_OT3_PIPETTE_DEFINITION"
RIGHT_PIPETTE_ENV_VAR_NAME = "RIGHT_OT3_PIPETTE_DEFINITION"

LEFT_PIPETTE_EEPROM_DIR_PATH = "/volumes/left-pipette-eeprom"
RIGHT_PIPETTE_EEPROM_DIR_PATH = "/volumes/right-pipette-eeprom"


@dataclass
class OT3PipetteEnvVar:
    """OT3 Pipette Environment Variable."""

    pipette_name: PipetteName
    pipette_model: int
    pipette_serial_code: bytes
    eeprom_file_name: str
    mount: Literal["left", "right"]

    @classmethod
    def from_json_string(
        cls, env_var_string: str, mount: Literal["left", "right"]
    ) -> "OT3PipetteEnvVar":
        """Create OT3PipetteEnvVar from json string."""
        env_var = json.loads(env_var_string)
        return cls(
            pipette_name=PipetteName[env_var["pipette_name"]],
            pipette_model=env_var["pipette_model"],
            pipette_serial_code=env_var["pipette_serial_code"].encode("utf-8"),
            eeprom_file_name=env_var["eeprom_file_name"],
            mount=mount,
        )

    def _eeprom_dir_path(self) -> str:
        """Get eeprom directory path."""
        return (
            LEFT_PIPETTE_EEPROM_DIR_PATH
            if self.mount == "left"
            else RIGHT_PIPETTE_EEPROM_DIR_PATH
        )

    @property
    def eeprom_file_path(self) -> str:
        """Get eeprom file path."""
        return "/".join([self._eeprom_dir_path(), self.eeprom_file_name])

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
    env_var_value: Optional[str] = os.environ.get(LEFT_PIPETTE_ENV_VAR_NAME)
    if env_var_value is None or len(env_var_value) == 0:
        raise ValueError(
            f"Environment variable {env_var_name} is not set. "
            "Please set this environment variable and try again."
        )
    return env_var_value


def main() -> None:
    """Main function."""
    left_pipette_json = _get_env_var(LEFT_PIPETTE_ENV_VAR_NAME)
    right_pipette_json = _get_env_var(RIGHT_PIPETTE_ENV_VAR_NAME)

    OT3PipetteEnvVar.from_json_string(left_pipette_json, "left").generate_eeprom_file()
    OT3PipetteEnvVar.from_json_string(
        right_pipette_json, "right"
    ).generate_eeprom_file()


if __name__ == "__main__":
    main()
