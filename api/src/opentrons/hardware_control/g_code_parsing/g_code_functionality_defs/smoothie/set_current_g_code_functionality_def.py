from typing import Dict
from string import Template
from enum import Enum
from opentrons.hardware_control.g_code_parsing.g_code_functionality_defs.\
    g_code_functionality_def_base import GCodeFunctionalityDefBase


class SetCurrentGCodeFunctionalityDef(GCodeFunctionalityDefBase):

    EXPECTED_ARGS = ['X', 'Y', 'Z', 'A', 'B', 'C']

    class ValDefinedMessage(str, Enum):
        Y = 'The current (in amps) for the Y-Axis Motor to $current'
        X = 'The current (in amps) for the X-Axis Motor to $current'
        Z = 'The current (in amps) for the Z-Axis Motor to $current'
        B = 'The current (in amps) for the B-Axis Motor to $current'
        A = 'The current (in amps) for the A-Axis Motor to $current'
        C = 'The current (in amps) for the C-Axis Motor to $current'

    @classmethod
    def _generate_command_explanation(
            cls,
            g_code_args: Dict[str, str]
    ) -> str:
        message_list = []
        for arg in cls.EXPECTED_ARGS:
            g_code_arg_val = g_code_args.get(arg)
            if g_code_arg_val is not None:
                message_template = Template(cls.ValDefinedMessage[arg].value)
                message = message_template.substitute(current=g_code_arg_val)
                message_list.append(message)

        return 'SETTING CURRENT:\n\t' + '\n\t'.join(message_list)
