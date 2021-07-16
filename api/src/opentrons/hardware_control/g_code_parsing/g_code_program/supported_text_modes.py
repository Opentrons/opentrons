from opentrons.hardware_control.g_code_parsing.g_code import GCode
from typing import Callable
from enum import Enum


# Can't use a dataclass because mypy doesn't like a dataclass
# with a Callable type that is set in another class.
# It thinks that the default_builder function in SupportedTextModes
# should take a self and code argument which is wrong.
# Implementing the long way takes care of this
class TextMode:
    """
    Class representing the name of a text mode and it's
    function to build the correct text
    """
    def __init__(self, name: str, builder: Callable[[GCode], str]) -> None:
        self._name = name
        self._builder = builder

    @property
    def name(self):
        return self._name

    @property
    def builder(self):
        return self._builder


def default_builder(code: GCode):
    """
    Function to build verbose string in form of:

    Code: <G Code> <Params>
    Explanation: <Textual Description>

    Example:

    Code: M203.1 A125.0 B40.0 C40.0 X600.0 Y400.0 Z125.0
    Explanation: Setting the max speed for the following axes:
        X-Axis: 600.0
        Y-Axis: 400.0
        Z-Axis: 125.0
        A-Axis: 125.0
        B-Axis: 40.0
        C-Axis: 40.0


    :param code: G-Code object to parse into a string
    :return: Textual description
    """
    return f'Code: {code.g_code} {code.g_code_body} \n' \
           f'Explanation: {code.get_explanation().command_explanation}\n' \
           f'Response: {code.response}'


def explanation_only(code: GCode):
    """
    Function to build string that contains only the explanation. In the form of:

    <Textual Description>

    Example:

    Setting the max speed for the following axes:
        X-Axis: 600.0
        Y-Axis: 400.0
        Z-Axis: 125.0
        A-Axis: 125.0
        B-Axis: 40.0
        C-Axis: 40.0


    :param code: G-Code object to parse into a string
    :return: Textual description
    """
    return code.get_explanation().command_explanation


def concise(code: GCode):
    """
    Function to build concise string. Removes all newlines and tabs In the form of:

    <G Code> <Params> -> <Concise Textual Description>

    Example:

    G28.2 X -> Homing the following axes: X

    :param code: G-Code object to parse into a string
    :return: Textual description
    """
    return f'{code.g_code} {code.g_code_body} -> ' \
           f'{code.get_explanation().command_explanation} -> ' \
           f'{code.response}'\
        .replace('\n', ' ')\
        .replace('\t', '')


class SupportedTextModes(Enum):
    """
    Class representing the different text modes that G-Codes can be parsed into

    Current modes are:

    Default: Most verbose mode. Includes G-Code and it's parameters, as well as a full
        textual explanation

    Explanation Only: Contains only the textual explanation

    Concise: Same as Default but with all newlines and tabs removed to fit everything on
        a single line
    """
    DEFAULT = TextMode(
        'Default',
        default_builder
    )
    EXPLANATION_ONLY = TextMode(
        'Explanation Only',
        explanation_only
    )
    CONCISE = TextMode(
        'Concise',
        concise
    )
