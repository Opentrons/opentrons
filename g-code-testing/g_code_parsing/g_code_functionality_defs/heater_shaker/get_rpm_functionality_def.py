import re
from typing import Dict
from g_code_parsing.g_code_functionality_defs.g_code_functionality_def_base import (  # noqa: E501
    GCodeFunctionalityDefBase,
)


class GetRPMGCodeFunctionalityDef(GCodeFunctionalityDefBase):
    RESPONSE_RE = re.compile(r"C:(?P<current_rpm>\d+) T:(?P<set_rpm>\d+)")

    @classmethod
    def _generate_command_explanation(cls, g_code_args: Dict[str, str]) -> str:
        return "Getting heater-shaker RPM"

    @classmethod
    def _generate_response_explanation(cls, response: str) -> str:
        match = cls.RESPONSE_RE.search(response)
        message = ""
        if match is not None:
            current_rpm = match.groupdict()["current_rpm"].strip()
            set_rpm = match.groupdict()["set_rpm"].strip()
            message = (
                f"Set RPM is {set_rpm}. "
                f"Current RPM is {current_rpm}"
            )
        return message