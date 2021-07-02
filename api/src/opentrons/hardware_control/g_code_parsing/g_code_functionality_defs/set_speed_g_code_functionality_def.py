from typing import Dict
from .g_code_functionality_def_base import GCodeFunctionalityDefBase


class SetSpeedGCodeFunctionalityDef(GCodeFunctionalityDefBase):

    SPEED_ARG_KEY = 'F'

    @classmethod
    def _generate_command_explanation(cls, g_code_args: Dict[str, str]) -> str:
        speed = g_code_args[cls.SPEED_ARG_KEY]
        return f'SETTING SPEED:\n\tSetting speed to {speed}'
