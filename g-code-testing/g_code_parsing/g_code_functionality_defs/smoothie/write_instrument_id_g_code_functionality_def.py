from typing import Dict
from g_code_parsing.g_code_functionality_defs.g_code_functionality_def_base import (  # noqa: E501
    GCodeFunctionalityDefBase,
)


class WriteInstrumentIDGCodeFunctionalityDef(GCodeFunctionalityDefBase):
    SIDE_EXPANSION_DICT = {"L": "Left", "R": "Right"}

    @classmethod
    def _generate_command_explanation(cls, g_code_args: Dict[str, str]) -> str:
        l_or_r = list(g_code_args.keys())[0]
        left_or_right = cls.SIDE_EXPANSION_DICT[l_or_r]

        return (
            f"Writing instrument ID {g_code_args[l_or_r]} for "
            f"{left_or_right} pipette"
        )
