import pytest
from g_code_parsing.g_code import reverse_enum
from typing import Dict, Type
from enum import Enum


class InputEnum(str, Enum):
    HOME = "G28.2"
    MOVE = "G0"
    DWELL = "G4"
    CURRENT_POSITION = "M114.2"
    LIMIT_SWITCH_STATUS = "M119"
    PROBE = "G38.2"
    ABSOLUTE_COORDS = "G90"
    RELATIVE_COORDS = "G91"


@pytest.fixture
def input_enum() -> Type[InputEnum]:
    return InputEnum


@pytest.fixture
def expected_dict() -> Dict:
    return {
        "G28.2": "HOME",
        "G0": "MOVE",
        "G4": "DWELL",
        "M114.2": "CURRENT_POSITION",
        "M119": "LIMIT_SWITCH_STATUS",
        "G38.2": "PROBE",
        "G90": "ABSOLUTE_COORDS",
        "G91": "RELATIVE_COORDS",
    }


def test_enum_reverse(input_enum, expected_dict) -> None:
    assert reverse_enum(input_enum) == expected_dict
