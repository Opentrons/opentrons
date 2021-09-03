import re
from typing import Dict
from g_code_parsing.g_code_functionality_defs.g_code_functionality_def_base import (  # noqa: E501
    GCodeFunctionalityDefBase,
)


class LidStatusGCodeFunctionalityDef(GCodeFunctionalityDefBase):

    RESPONSE_RE = re.compile(r"Lid:(\w+)")

    @classmethod
    def _generate_command_explanation(cls, g_code_args: Dict[str, str]) -> str:
        return "Getting status of thermocycler lid"

    @classmethod
    def _generate_response_explanation(cls, response: str) -> str:
        match = cls.RESPONSE_RE.match(response)
        message = "Lid Status: "
        if match is not None:
            message += match.group(1).strip().capitalize()
        else:
            message += "Unknown"

        return message
