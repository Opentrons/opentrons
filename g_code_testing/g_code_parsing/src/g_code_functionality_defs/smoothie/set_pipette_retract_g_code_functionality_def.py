from typing import Dict
from string import Template
from g_code_functionality_defs.g_code_functionality_def_base import (  # noqa: E501
    GCodeFunctionalityDefBase,
)


class SetPipetteRetractGCodeFunctionalityDef(GCodeFunctionalityDefBase):
    # Using this list to output string in specific order
    EXPECTED_ARGS = ["B", "C", "Z", "A"]

    VAL_DEFINED_MESSAGE = Template("$name-Axis: $distance")

    @classmethod
    def _generate_command_explanation(cls, g_code_args: Dict[str, str]) -> str:
        message_list = []
        for arg in cls.EXPECTED_ARGS:
            g_code_arg_val = g_code_args.get(arg)
            if g_code_arg_val is not None:
                message_list.append(
                    cls.VAL_DEFINED_MESSAGE.substitute(
                        name=arg, distance=g_code_arg_val
                    )
                )

        return (
            "Setting the pipette endstop retract distance "
            "for the following axes:\n\t" + "\n\t".join(message_list)
        )
