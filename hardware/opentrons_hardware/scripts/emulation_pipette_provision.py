"""Script to write pipette serial numbers to eeprom files.

This script is configured to run against the emulation container.
High level overview of the script:

- Read pipette definition from environment variables
- Generate pipette serial code
- Write pipette serial code to eeprom file
- Profit
"""

from dataclasses import dataclass
import os
import json
from typing import Optional
from opentrons_hardware.firmware_bindings.constants import PipetteName
from opentrons_hardware.instruments.pipettes.serials import serial_val_from_parts

LEFT_PIPETTE_ENV_VAR_NAME = "LEFT_OT3_PIPETTE_DEFINITION"
RIGHT_PIPETTE_ENV_VAR_NAME = "RIGHT_OT3_PIPETTE_DEFINITION"

NO_PIPETTE_NAME = "EMPTY"
NO_PIPETTE_MODEL = -1
NO_PIPETTE_SERIAL_CODE = ""


@dataclass
class OT3PipetteEnvVar:
    """OT3 Pipette Environment Variable."""

    pipette_name: str
    pipette_model: int
    pipette_serial_code: str
    eeprom_file_path: str

    def is_no_pipette(self) -> bool:
        """Check if pipette is no pipette."""
        no_pipette = (
            self.pipette_name == NO_PIPETTE_NAME,
            self.pipette_model == NO_PIPETTE_MODEL,
            self.pipette_serial_code == NO_PIPETTE_SERIAL_CODE,
        )
        any_no_pipette_fields_have_been_set = any(no_pipette)
        all_no_pipette_fields_are_not_set = not all(no_pipette)

        if any_no_pipette_fields_have_been_set and all_no_pipette_fields_are_not_set:
            raise ValueError(
                "\n".join(
                    (
                        "Invalid empty pipette definition. Expecting the following:",
                        f"pipette_name: {NO_PIPETTE_NAME}",
                        f"pipette_model: {NO_PIPETTE_MODEL}",
                        f"pipette_serial_code: {NO_PIPETTE_SERIAL_CODE}",
                        "",
                        "You passed the following:",
                        f"pipette_name: {self.pipette_name}",
                        f"pipette_model: {self.pipette_model}",
                        f"pipette_serial_code: {self.pipette_serial_code}",
                    )
                )
            )

        return all(no_pipette)

    @classmethod
    def from_json_string(cls, env_var_string: str) -> "OT3PipetteEnvVar":
        """Create OT3PipetteEnvVar from json string."""
        env_var = json.loads(env_var_string)
        return cls(
            pipette_name=env_var["pipette_name"],
            pipette_model=env_var["pipette_model"],
            pipette_serial_code=env_var["pipette_serial_code"],
            eeprom_file_path=env_var["eeprom_file_path"],
        )

    def _generate_serial_code(self) -> bytes:
        """Generate serial code."""
        return serial_val_from_parts(
            PipetteName[self.pipette_name],
            self.pipette_model,
            self.pipette_serial_code.encode("utf-8"),
        )

    def generate_eeprom_file(self) -> None:
        """Generate eeprom file for pipette."""
        with open(self.eeprom_file_path, "wb") as f:
            if self.is_no_pipette():
                return
            else:
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
