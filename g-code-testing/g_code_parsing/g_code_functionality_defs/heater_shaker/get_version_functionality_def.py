import re
from typing import Dict
from g_code_parsing.g_code_functionality_defs.g_code_functionality_def_base import (  # noqa: E501
    GCodeFunctionalityDefBase,
)


class GetVersionGCodeFunctionalityDef(GCodeFunctionalityDefBase):
    RESPONSE_RE = re.compile(r"FW:(?P<firmware_version>.*) HW:(?P<hardware_version>.*) SerialNo:(?P<serial_num>.*) ")

    @classmethod
    def _generate_command_explanation(cls, g_code_args: Dict[str, str]) -> str:
        return "Getting heater-shaker version information"

    @classmethod
    def _generate_response_explanation(cls, response: str) -> str:
        match = cls.RESPONSE_RE.search(response)
        message = ""
        if match is not None:
            fw_version, model, serial_number = match.groups()
            message = (
                f"Heater-Shaker info:"
                f"\n\tSerial Number: {serial_number.strip()}"
                f"\n\tModel: {model.strip()}"
                f"\n\tFirmware Version: {fw_version.strip()}"
            )

        return message
