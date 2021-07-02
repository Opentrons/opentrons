from abc import ABC
from typing import Dict, Union


class GCodeFunctionalityDefBase(ABC):

    CODE_KEY = 'Code'
    COMMAND_NAME_KEY = 'Command Name'
    PROVIDED_ARGS_KEY = 'Provided Arguments'
    COMMAND_EXPLANATION_KEY = 'Command Explanation'

    @classmethod
    def generate_explanation_dict(
        cls,
        code,
        command_name,
        provided_args
    ) -> Dict[str, Union[str, Dict]]:
        g_code_explanation_dict = {
            cls.CODE_KEY: code,
            cls.COMMAND_NAME_KEY: command_name,
            cls.PROVIDED_ARGS_KEY: provided_args,
            cls.COMMAND_EXPLANATION_KEY: cls._generate_command_explanation(
                provided_args)
        }
        return g_code_explanation_dict

    @classmethod
    def _generate_command_explanation(
            cls,
            g_code_args: Dict[str, str]
    ) -> str:
        ...
