import re
from enum import Enum
from typing import Dict

WRITE_REGEX = re.compile(r"(.*?) \| (.*?) \|(.*?)$")

def reverse_enum(enum_to_reverse: Enum) -> Dict:
    """
    Returns dictionary with keys and values switched from passed Enum
    :param enum_to_reverse: The Enum that you want to reverse
    :return: Reversed dictionary
    """
    members = enum_to_reverse.__members__.keys()
    values = [enum_to_reverse[member].value for member in members]
    return dict(zip(values, members))


