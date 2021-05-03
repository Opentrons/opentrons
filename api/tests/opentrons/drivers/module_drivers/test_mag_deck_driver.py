import pytest
from opentrons.drivers.mag_deck import driver
from opentrons.drivers.utils import ParseError


@pytest.mark.parametrize(
    argnames=["input_str", "expected"],
    argvalues=[
        ["height:12.34", 12.34],
        ["Z:32.2", 32.2],
        ["  Z:32.2  ", 32.2],
    ]
)
def test_parse_distance_response_success(
        input_str: str, expected: float) -> None:
    """Test successful parsing"""
    assert expected == driver._parse_distance_response(input_str)


@pytest.mark.parametrize(
    argnames=["input_str"],
    argvalues=[
        ["heigt:12.34"],
        ["height:wolf"],
        ["Z :32.2"],
        [''],
    ]
)
def test_parse_distance_response_failure(input_str: str) -> None:
    """Test failed parsing"""
    with pytest.raises(ParseError):
        driver._parse_distance_response(input_str)
