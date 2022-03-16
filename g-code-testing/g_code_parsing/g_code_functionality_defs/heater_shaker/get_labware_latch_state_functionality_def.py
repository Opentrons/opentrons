import re
from typing import Dict
from g_code_parsing.g_code_functionality_defs.g_code_functionality_def_base import (  # noqa: E501
    GCodeFunctionalityDefBase,
)


class GetLabwareLatchStateGCodeFunctionalityDef(GCodeFunctionalityDefBase):
    RESPONSE_RE = re.compile(r"M241 STATE:([A-Z_]*)")

    @classmethod
    def _generate_command_explanation(cls, g_code_args: Dict[str, str]) -> str:
        return "Getting heater-shaker labware latch state"

    @classmethod
    def _generate_response_explanation(cls, response: str) -> str:
        match = cls.RESPONSE_RE.match(response)
        message = ""

        if match is not None:
            message = f"Labware Latch State: {match.group(1)}"

        return message
