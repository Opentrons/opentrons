from typing import Dict
from string import Template
from enum import Enum
from g_code_parsing.g_code_functionality_defs.g_code_functionality_def_base import (  # noqa: E501
    GCodeFunctionalityDefBase,
)


class EditPIDParamsGCodeFunctionalityDef(GCodeFunctionalityDefBase):
    # Using this list to output string in specific order
    EXPECTED_ARGS = ["P", "I", "D"]

    class ValDefinedMessage(str, Enum):
        P = "\n\tKp: $val"
        I = "\n\tKi: $val"  # noqa: E741
        D = "\n\tKd: $val"

    @classmethod
    def _generate_command_explanation(cls, g_code_args: Dict[str, str]) -> str:
        message_list = []
        for arg in cls.EXPECTED_ARGS:
            g_code_arg_val = g_code_args.get(arg)
            if g_code_arg_val is not None:
                message_temp = Template(cls.ValDefinedMessage[arg].value)
                message = message_temp.substitute(val=g_code_arg_val)
                message_list.append(message)

        return f'Editing PID values to the following:{"".join(message_list)}'

    @classmethod
    def _generate_response_explanation(cls, response: str) -> str:
        message = "Edit successful"

        if "ERROR" in response.upper() and "BUSY" in response.upper():
            message = "Cannot set PID values. Thermocycler busy"

        return message
