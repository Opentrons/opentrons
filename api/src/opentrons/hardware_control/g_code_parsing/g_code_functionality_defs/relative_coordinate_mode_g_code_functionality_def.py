from typing import Dict
from .g_code_functionality_def_base import GCodeFunctionalityDefBase


class RelativeCoordinateModeGCodeFunctionalityDef(GCodeFunctionalityDefBase):

    @classmethod
    def _generate_command_explanation(cls, g_code_args: Dict[str, str]) -> str:
        return 'RELATIVE COORDINATE MODE: \n\tSwitching to Relative Coordinate Mode'
