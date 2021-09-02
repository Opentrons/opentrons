import re
from typing import Dict
from g_code_functionality_defs.g_code_functionality_def_base import (  # noqa: E501
    GCodeFunctionalityDefBase,
)


class DeviceInfoGCodeFunctionalityDef(GCodeFunctionalityDefBase):
    RESPONSE_RE = re.compile(r"serial:(.*?)model:(.*?)version:(.*?)$")

    @classmethod
    def _generate_command_explanation(cls, g_code_args: Dict[str, str]) -> str:
        return "Getting thermocycler device info"

    @classmethod
    def _generate_response_explanation(cls, response: str) -> str:
        match = cls.RESPONSE_RE.match(response)
        message = ""
        if match is not None:
            serial_number, model, fw_version = match.groups()
            message = (
                f"Thermocycler info:"
                f"\n\tSerial Number: {serial_number.strip()}"
                f"\n\tModel: {model.strip()}"
                f"\n\tFirmware Version: {fw_version.strip()}"
            )

        return message
