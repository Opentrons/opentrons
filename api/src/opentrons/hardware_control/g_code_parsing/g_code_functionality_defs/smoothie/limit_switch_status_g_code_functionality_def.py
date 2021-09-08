from typing import Dict
from opentrons.hardware_control.g_code_parsing.g_code_functionality_defs.g_code_functionality_def_base import (  # noqa: E501
    GCodeFunctionalityDefBase,
)


class LimitSwitchStatusGCodeFunctionalityDef(GCodeFunctionalityDefBase):
    @classmethod
    def _generate_command_explanation(cls, g_code_args: Dict[str, str]) -> str:
        return "Getting the limit switch status"

    @classmethod
    def _generate_response_explanation(cls, response: str) -> str:
        return response
