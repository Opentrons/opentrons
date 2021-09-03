from typing import Dict
from g_code_parsing.g_code_functionality_defs.g_code_functionality_def_base import (  # noqa: E501
    GCodeFunctionalityDefBase,
)


class MoveGCodeFunctionalityDef(GCodeFunctionalityDefBase):

    HEIGHT_ARG = "Z"

    @classmethod
    def _generate_command_explanation(cls, g_code_args: Dict[str, str]) -> str:
        height = g_code_args[cls.HEIGHT_ARG]
        return f"Setting magnet height to {height}mm"
