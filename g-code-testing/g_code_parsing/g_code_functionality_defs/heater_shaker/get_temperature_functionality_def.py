import re
from typing import Dict
from g_code_parsing.g_code_functionality_defs.g_code_functionality_def_base import (  # noqa: E501
    GCodeFunctionalityDefBase,
)


class GetTempGCodeFunctionalityDef(GCodeFunctionalityDefBase):
    RESPONSE_RE = re.compile(r"C:(?P<current_temp>\d+.\d+) T:(?P<set_temp>\d+.\d+)")

    @classmethod
    def _generate_command_explanation(cls, g_code_args: Dict[str, str]) -> str:
        return "Getting heater-shaker temperature"

    @classmethod
    def _generate_response_explanation(cls, response: str) -> str:
        match = cls.RESPONSE_RE.search(response)
        message = ""

        if match is not None:
            current_temp = match.groupdict()["current_temp"].strip()
            set_temp = match.groupdict()["set_temp"].strip()
            message = f"Set temp is {set_temp}C. " f"Current temp is {current_temp}C"
        return message
