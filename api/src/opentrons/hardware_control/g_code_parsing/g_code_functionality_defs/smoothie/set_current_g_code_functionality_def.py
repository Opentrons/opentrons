from typing import Dict
from string import Template
from enum import Enum
from opentrons.hardware_control.g_code_parsing.g_code_functionality_defs.g_code_functionality_def_base import (  # noqa: E501
    GCodeFunctionalityDefBase,
)


class SetCurrentGCodeFunctionalityDef(GCodeFunctionalityDefBase):
    # Using this list to output string in specific order
    EXPECTED_ARGS = ["X", "Y", "Z", "A", "B", "C"]

    class ValDefinedMessage(str, Enum):
        Y = "Y-Axis Motor: $current"
        X = "X-Axis Motor: $current"
        Z = "Z-Axis Motor: $current"
        B = "B-Axis Motor: $current"
        A = "A-Axis Motor: $current"
        C = "C-Axis Motor: $current"

    @classmethod
    def _generate_command_explanation(cls, g_code_args: Dict[str, str]) -> str:
        message_list = []
        for arg in cls.EXPECTED_ARGS:
            g_code_arg_val = g_code_args.get(arg)
            if g_code_arg_val is not None:
                message_template = Template(cls.ValDefinedMessage[arg].value)
                message = message_template.substitute(current=g_code_arg_val)
                message_list.append(message)

        return "Setting the current (in amps) to:\n\t" + "\n\t".join(message_list)
