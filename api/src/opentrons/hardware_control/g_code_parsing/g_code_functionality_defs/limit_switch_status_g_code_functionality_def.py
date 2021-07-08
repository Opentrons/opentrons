from typing import Dict
from .g_code_functionality_def_base import GCodeFunctionalityDefBase


class LimitSwitchStatusGCodeFunctionalityDef(GCodeFunctionalityDefBase):

    @classmethod
    def _generate_command_explanation(cls, g_code_args: Dict[str, str]) -> str:
        return f'LIMIT SWITCH STATUS:\n\tGetting the limit switch status'
