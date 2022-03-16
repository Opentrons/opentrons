import re
from typing import Dict
from string import Template
from g_code_parsing.g_code_functionality_defs.g_code_functionality_def_base import (  # noqa: E501
    GCodeFunctionalityDefBase,
)


class StepsPerMMGCodeFunctionalityDef(GCodeFunctionalityDefBase):
    # Using this list to output string in specific order
    EXPECTED_ARGS = ["X", "Y", "Z", "A", "B", "C"]

    VAL_DEFINED_MESSAGE = Template("$name-Axis: $steps steps per mm")

    RESPONSE_RE = re.compile(r"(?P<axis>[ABCXYZ]):(?P<value>[\d.]+)")

    @classmethod
    def _generate_command_explanation(cls, g_code_args: Dict[str, str]) -> str:
        message_list = []
        for arg in cls.EXPECTED_ARGS:
            g_code_arg_val = g_code_args.get(arg)
            if g_code_arg_val is not None:
                message_list.append(
                    cls.VAL_DEFINED_MESSAGE.substitute(name=arg, steps=g_code_arg_val)
                )

        return "Setting the following axes steps per mm:\n\t" + "\n\t".join(
            message_list
        )

    @classmethod
    def _generate_response_explanation(cls, response: str) -> str:
        steps_string = "\n\t".join(
            [
                f"{match['axis']} Axis: {match['value']}"
                for match in cls.RESPONSE_RE.finditer(response)
            ]
        )

        return "\n\t".join(["Current set steps per mm:", steps_string])
