from typing import Dict
from opentrons.hardware_control.g_code_parsing.g_code_functionality_defs.g_code_functionality_def_base import (  # noqa: E501
    GCodeFunctionalityDefBase,
)


class SetSpeedGCodeFunctionalityDef(GCodeFunctionalityDefBase):

    SPEED_ARG_KEY = "F"

    @classmethod
    def _generate_command_explanation(cls, g_code_args: Dict[str, str]) -> str:
        speed = g_code_args[cls.SPEED_ARG_KEY]
        return f"Setting speed to {speed}"
