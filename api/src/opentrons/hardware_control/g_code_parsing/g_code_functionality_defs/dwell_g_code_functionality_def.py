from typing import Dict
from .g_code_functionality_def_base import GCodeFunctionalityDefBase


class DwellGCodeFunctionalityDef(GCodeFunctionalityDefBase):

    DWELL_ARG_KEY = 'P'

    @classmethod
    def _generate_command_explanation(cls, g_code_args: Dict[str, str]) -> str:
        duration = g_code_args[cls.DWELL_ARG_KEY]
        return f'DWELLING:\n\tPausing movement for {duration}ms'
