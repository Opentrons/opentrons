import pytest
import os
from opentrons.hardware_control.g_code_parsing.g_code_program import GCodeProgram
from opentrons.hardware_control.g_code_parsing.g_code import GCode
from typing import List, Dict


def parsed_log_file() -> GCodeProgram:
    file_path = os.path.join(
        os.path.dirname(__file__),
        'data/smoothie_g_code_coverage.txt'
    )
    return GCodeProgram.from_log_file(file_path).g_codes


def expected_function_name_values() -> List[str]:
    return [
        "HOME",
        "HOME",
        "HOME",
        "HOME",
        "HOME",
        "HOME",
        "HOME",
        "MOVE",
        "MOVE",
        "MOVE",
        "SET_SPEED",
        "WAIT",
        "SET_CURRENT",
    ]


def expected_arg_values() -> List[Dict[str, int]]:
    return [
        {'A': None, 'B': None, 'C': None, 'X': None, 'Y': None, 'Z': None},
        {'X': None},
        {'Y': None},
        {'Z': None},
        {'A': None},
        {'B': None},
        {'C': None},
        {'X': 113.38, 'Y': 11.24},
        {'A': 132.6},
        {'C': -8.5},
        {'F': 601},
        {},
        {'A': 0.1, 'B': 0.3, 'C': 0.05, 'X': 0.3, 'Y': 0.3, 'Z': 0.1}

    ]


@pytest.mark.parametrize(
    "parsed_value,expected_value",
    list(zip(parsed_log_file(), expected_function_name_values()))
)
def test_smoothie_g_code_function_lookup(
    parsed_value: GCode,
    expected_value: str
) -> None:
    assert parsed_value.get_gcode_function() == expected_value


@pytest.mark.parametrize(
    "parsed_value,expected_value",
    list(zip(parsed_log_file(), expected_arg_values()))
)
def test_g_code_args(
    parsed_value: GCode,
    expected_value: dict
) -> None:
    assert parsed_value.g_code_args == expected_value
