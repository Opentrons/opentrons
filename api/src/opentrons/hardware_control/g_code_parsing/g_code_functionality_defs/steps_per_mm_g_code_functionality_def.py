from typing import Dict
from string import Template
from .g_code_functionality_def_base import GCodeFunctionalityDefBase


class StepsPerMMGCodeFunctionalityDef(GCodeFunctionalityDefBase):

    EXPECTED_ARGS = ['X', 'Y', 'Z', 'A', 'B', 'C', 'F']

    VAL_DEFINED_MESSAGE = Template('$name-Axis $steps steps per mm')

    @classmethod
    def _generate_command_explanation(cls, g_code_args: Dict[str, str]) -> str:
        message_list = []
        for arg in cls.EXPECTED_ARGS:
            g_code_arg_val = g_code_args.get(arg)
            if g_code_arg_val is not None:
                message_list.append(
                    cls.VAL_DEFINED_MESSAGE.substitute(name=arg, steps=g_code_arg_val)
                )

        return 'STEPS PER MM:\n\tSetting the following axes steps per mm:\n\t'\
               + '\n\t'.join(message_list)
