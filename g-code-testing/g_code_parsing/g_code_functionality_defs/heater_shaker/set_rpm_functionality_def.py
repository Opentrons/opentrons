from typing import Dict
from g_code_parsing.g_code_functionality_defs.g_code_functionality_def_base import (  # noqa: E501
    GCodeFunctionalityDefBase,
)


class SetRPMGCodeFunctionalityDef(GCodeFunctionalityDefBase):

    RPM_ARG_KEY = "S"

    @classmethod
    def _generate_command_explanation(cls, g_code_args: Dict[str, str]) -> str:
        rpm = g_code_args[cls.RPM_ARG_KEY]
        return f"Setting heater-shaker RPM to {rpm}"
