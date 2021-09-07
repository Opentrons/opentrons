from typing import Dict
from string import Template
from enum import Enum
from opentrons.hardware_control.g_code_parsing.g_code_functionality_defs.g_code_functionality_def_base import (  # noqa: E501
    GCodeFunctionalityDefBase,
)


class AccelerationGCodeFunctionalityDef(GCodeFunctionalityDefBase):
    # Using this list to output string in specific order
    EXPECTED_ARGS = ["S", "X", "Y", "Z", "A", "B", "C"]

    class ValDefinedMessage(str, Enum):
        S = "Default: $ident"
        Y = "Y-Axis: $ident"
        X = "X-Axis: $ident"
        Z = "Left Pipette Arm: $ident"
        B = "Left Pipette Suction: $ident"
        A = "Right Pipette Arm: $ident"
        C = "Right Pipette Suction: $ident"

    @classmethod
    def _generate_command_explanation(cls, g_code_args: Dict[str, str]) -> str:
        message_list = []
        for arg in cls.EXPECTED_ARGS:
            g_code_arg_val = g_code_args.get(arg)
            if g_code_arg_val is not None:
                pos_message_template = Template(cls.ValDefinedMessage[arg].value)
                message = pos_message_template.substitute(ident=g_code_arg_val)
                message_list.append(message)

        return "Setting acceleration for the following axes:\n\t" + "\n\t".join(
            message_list
        )
