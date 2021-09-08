import re

from opentrons.hardware_control.g_code_parsing.g_code import GCode
from opentrons.hardware_control.g_code_parsing.errors import InvalidTextModeError
from typing import Callable
from enum import Enum

MULTIPLE_SPACE_REGEX = re.compile(" +")


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

    Code: M92 X80.0 Y80.0 Z400 A400
    Explanation: Setting the max speed for the following axes:
        X-Axis: 80.0 steps per mm
        Y-Axis: 80.0 steps per mm
        Z-Axis: 400.0 steps per mm
        A-Axis: 400.0 steps per mm
    Response: Current set steps per mm:
        X Axis: 80.000000
        Y Axis: 80.000000
        Z Axis: 400.000000
        A Axis: 400.000000
        B Axis: 955.000000
        C Axis: 768.000000


    :param code: G-Code object to parse into a string
    :return: Textual description
    """
    message = (
        f"Device: {code.device_name}\n"
        f"Code: {code.g_code} {code.g_code_body}\n"
        f"Explanation: {code.get_explanation().command_explanation}\n"
        f"Response: {code.get_explanation().response}"
        f"\n-----------------------------------------"
    )
    return MULTIPLE_SPACE_REGEX.sub(" ", message).strip()


def concise_builder(code: GCode):
    """
    Function to build concise string. Removes all newlines and tabs In the form of:

    <G Code> <Params> -> <Concise Textual Description>

    Example:

    G28.2 X -> Homing the following axes: X

    :param code: G-Code object to parse into a string
    :return: Textual description
    """
    message = (
        f"{code.device_name}: {code.g_code} {code.g_code_body} -> "
        f"{code.get_explanation().command_explanation} -> "
        f"{code.get_explanation().response}".replace("\n", " ").replace("\t", "")
    )
    return MULTIPLE_SPACE_REGEX.sub(" ", message).strip()


def g_code_only_builder(code: GCode):
    """
    Function to build string that contains only the raw G-Code input and output

    <Raw G-Code> -> <Raw G-Code Output>

    Example:

    G28.2 X -> Homing the following axes: X

    :param code: G-Code object to parse into a string
    :return: Textual description
    """
    message = f"{code.device_name}: {code.g_code_line} -> {code.response}"
    return MULTIPLE_SPACE_REGEX.sub(" ", message).strip()


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

    DEFAULT = "Default"
    CONCISE = "Concise"
    G_CODE = "G-Code"

    @classmethod
    def get_valid_modes(cls):
        return [cls.CONCISE.value, cls.DEFAULT.value, cls.G_CODE.value]

    @classmethod
    def get_text_mode(cls, key: str):
        # Defining this inside of the function so that it does not show up
        # when using the __members__ attribute
        _internal_mapping = {
            cls.DEFAULT.value: TextMode(cls.DEFAULT.value, default_builder),
            cls.CONCISE.value: TextMode(cls.CONCISE.value, concise_builder),
            cls.G_CODE.value: TextMode(cls.G_CODE.value, g_code_only_builder),
        }
        members = [member.value for member in list(cls.__members__.values())]
        if key not in members:
            raise InvalidTextModeError(key, members)

        return _internal_mapping[key]

    @classmethod
    def get_text_mode_by_enum_value(cls, enum_value):
        return cls.get_text_mode(enum_value.value)
