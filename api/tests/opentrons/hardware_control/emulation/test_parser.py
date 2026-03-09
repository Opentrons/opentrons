from typing import Sequence

import pytest
from opentrons.hardware_control.emulation.parser import Parser, Command


@pytest.fixture
def parser() -> Parser:
    return Parser()


@pytest.mark.parametrize(
    argnames=["line", "expected"],
    argvalues=[
        ["", []],
        ["G2", [Command(gcode="G2", body="", params={})]],
        [
            "   M123.32 with some trailing nonesense   ",
            [Command(gcode="M123.32", body="with some trailing nonesense", params={})],
        ],
        [
            "G123 V2 X0",
            [Command(gcode="G123", body="V2 X0", params={"V": 2.0, "X": 0.0})],
        ],
        [
            "dfuversionM12.3G2",
            [
                Command(gcode="dfu", body="", params={}),
                Command(gcode="version", body="", params={}),
                Command(gcode="M12.3", body="", params={}),
                Command(gcode="G2", body="", params={}),
            ],
        ],
        # Substring check. Don't confuse G1 with G123 or G123 with G123.2
        [
            "G123G123.2G1",
            [
                Command(gcode="G123", body="", params={}),
                Command(gcode="G123.2", body="", params={}),
                Command(gcode="G1", body="", params={}),
            ],
        ],
        # Negative numbers, no spaces.
        [
            "M123.2 B132C-1D321.2",
            [
                Command(
                    gcode="M123.2",
                    body="B132C-1D321.2",
                    params={"B": 132, "C": -1, "D": 321.2},
                )
            ],
        ],
        # Just key, no value.
        [
            "M123.2 LX R",
            [
                Command(
                    gcode="M123.2",
                    body="LX R",
                    params={"L": None, "X": None, "R": None},
                )
            ],
        ],
    ],
)
def test_parse_command(parser: Parser, line: str, expected: Sequence[Command]) -> None:
    """It should parse the commands and parameters."""
    result = list(parser.parse(line))

    assert result == expected


@pytest.mark.parametrize(
    argnames=["line"],
    argvalues=[["not a gcode G123"], ["X123 G123"], ["   DFU G123"], ["no gcode"]],
)
def test_fail_parse(parser: Parser, line: str) -> None:
    """It should raise an exception"""
    with pytest.raises(ValueError, match="Invalid content"):
        list(parser.parse(line=line))
