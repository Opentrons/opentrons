from typing import Dict
from .g_code_functionality_def_base import GCodeFunctionalityDefBase


class ResetFromErrorGCodeFunctionalityDef(GCodeFunctionalityDefBase):

    @classmethod
    def _generate_command_explanation(cls, g_code_args: Dict[str, str]) -> str:
        return 'RESET FROM ERROR: \n\tResetting OT-2 from error state'
