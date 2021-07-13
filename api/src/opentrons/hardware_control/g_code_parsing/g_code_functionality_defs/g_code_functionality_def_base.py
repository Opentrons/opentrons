from abc import ABC
from typing import Dict, Any
from dataclasses import dataclass


@dataclass
class Explanation:
    """
    Dataclass containing information about the ran G-Code.
    """
    CODE_KEY = 'Code'
    COMMAND_NAME_KEY = 'Command Name'
    PROVIDED_ARGS_KEY = 'Provided Arguments'
    COMMAND_EXPLANATION_KEY = 'Command Explanation'

    code: str
    command_name: str
    provided_args: Dict[str, Any]
    command_explanation: str


class GCodeFunctionalityDefBase(ABC):
    """
    ABC for classes that provide the string building for the textual descriptions of
    each G-Code. It is required that each child class implements
    _generate_command_explanations
    """
    @classmethod
    def generate_explanation(
        cls,
        code,
        command_name,
        provided_args
    ) -> Explanation:
        return Explanation(
            code,
            command_name,
            provided_args,
            cls._generate_command_explanation(provided_args)
        )

    @classmethod
    def _generate_command_explanation(
            cls,
            g_code_args: Dict[str, str]
    ) -> str:
        ...
