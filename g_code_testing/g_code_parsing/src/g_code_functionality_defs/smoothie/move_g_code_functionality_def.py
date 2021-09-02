from typing import Dict
from string import Template
from enum import Enum
from g_code_functionality_defs.g_code_functionality_def_base import (  # noqa: E501
    GCodeFunctionalityDefBase,
)


class MoveGCodeFunctionalityDef(GCodeFunctionalityDefBase):
    # Using this list to output string in specific order
    EXPECTED_ARGS = ["X", "Y", "Z", "A", "B", "C", "F"]

    class ValDefinedMessage(str, Enum):
        Y = "The gantry to $ident on the Y-Axis"
        X = "The gantry to $ident on the X-Axis"
        Z = "The left pipette arm height to $ident"
        B = "The left pipette suction to $ident"
        A = "The right pipette arm height to $ident"
        C = "The right pipette suction to $ident"
        F = "At a speed of $ident"

    @classmethod
    def _generate_command_explanation(cls, g_code_args: Dict[str, str]) -> str:
        message_list = []
        for arg in cls.EXPECTED_ARGS:
            g_code_arg_val = g_code_args.get(arg)
            if g_code_arg_val is not None:
                pos_message_template = Template(cls.ValDefinedMessage[arg].value)
                message = pos_message_template.substitute(ident=g_code_arg_val)
                message_list.append(message)

        return "Moving the robot as follows:\n\t" + "\n\t".join(message_list)
