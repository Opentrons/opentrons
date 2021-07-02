import re
from typing import Dict, Type
from opentrons.drivers.smoothie_drivers.driver_3_0 import GCODE as SMOOTHIE_GCODE


WRITE_REGEX = re.compile(r"(.*?) \| (.*?) \|(.*?)$")


def reverse_enum(enum_to_reverse: Type[SMOOTHIE_GCODE]) -> Dict:
    """
    Returns dictionary with keys and values switched from passed Enum
    :param enum_to_reverse: The Enum that you want to reverse
    :return: Reversed dictionary
    """
    # I don't know what is going on with mypy, it is complaining
    # about keys not existing as an attribute. I am not calling it
    # as an attribute. I am calling it as a function.
    members = enum_to_reverse._member_map_.keys()  # type: ignore[attr-defined]
    values = [
        enum_to_reverse[member].value
        for member in members
    ]
    return dict(zip(values, members))
