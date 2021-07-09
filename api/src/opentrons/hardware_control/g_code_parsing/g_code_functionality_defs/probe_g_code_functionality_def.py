from typing import Dict
from .g_code_functionality_def_base import GCodeFunctionalityDefBase


class ProbeGCodeFunctionalityDef(GCodeFunctionalityDefBase):
    SPEED_ARG_KEY = 'F'
    EXPECTED_ARGS = ['X', 'Y', 'Z', 'A', 'B', 'C', 'F']

    @classmethod
    def _generate_command_explanation(cls, g_code_args: Dict[str, str]) -> str:
        passed_args = g_code_args.keys()
        current_keys = [
            key
            for key
            in cls.EXPECTED_ARGS
            if key in passed_args
        ]

        speed = None

        if cls.SPEED_ARG_KEY in current_keys:
            speed = g_code_args[cls.SPEED_ARG_KEY]
            current_keys.remove(cls.SPEED_ARG_KEY)

        axis_to_probe = ', '.join(current_keys)

        if speed is None:
            message = f'PROBE:\n\tProbing the following axes: {axis_to_probe}'
        else:
            message = f'PROBE:\n\tProbing the following axes: {axis_to_probe}; ' \
                      f'at a speed of {speed}'

        return message
