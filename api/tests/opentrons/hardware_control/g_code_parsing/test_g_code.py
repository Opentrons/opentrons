import pytest
import os
from opentrons.hardware_control.g_code_parsing.g_code_program import GCodeProgram
from opentrons.hardware_control.g_code_parsing.g_code import GCode
from typing import List


def parsed_log_file() -> GCodeProgram:
    file_path = os.path.join(
        os.path.dirname(__file__),
        'data/smoothie_g_code_coverage.txt'
    )
    return GCodeProgram.from_log_file(file_path).g_codes


def log_file_expected_values() -> List[str]:
    file_path = os.path.join(
        os.path.dirname(__file__),
        'data/expected_values.txt'
    )
    with open(file_path, 'r') as file:
        return [line.strip() for line in file.readlines()]


@pytest.mark.parametrize(
    "parsed_value,expected_value",
    list(zip(parsed_log_file(), log_file_expected_values()))
)
def test_smoothie_g_code_function_lookup(
    parsed_value: GCode,
    expected_value: str
) -> None:
    assert parsed_value.get_gcode_function() == expected_value
