from typing import Dict
from opentrons.hardware_control.g_code_parsing.g_code_functionality_defs.\
    g_code_functionality_def_base import GCodeFunctionalityDefBase


class ReadInstrumentModelGCodeFunctionalityDef(GCodeFunctionalityDefBase):
    SIDE_EXPANSION_DICT = {
        'L': 'Left',
        'R': 'Right'
    }

    @classmethod
    def _generate_command_explanation(cls, g_code_args: Dict[str, str]) -> str:
        left_or_right = cls.SIDE_EXPANSION_DICT[list(g_code_args.keys())[0]]

        return f'Reading instrument model for {left_or_right} pipette'
