from typing import Dict

from g_code_functionality_defs.g_code_functionality_def_base import (  # noqa: E501
    GCodeFunctionalityDefBase,
)


class HomeGCodeFunctionalityDef(GCodeFunctionalityDefBase):
    EXPECTED_ARGS = ["X", "Y", "Z", "A", "B", "C"]

    @classmethod
    def _generate_command_explanation(cls, g_code_args: Dict[str, str]) -> str:
        passed_args = g_code_args.keys()
        current_keys = [key for key in cls.EXPECTED_ARGS if key in passed_args]

        axis_to_home = ", ".join(current_keys)
        return f"Homing the following axes: {axis_to_home}"
