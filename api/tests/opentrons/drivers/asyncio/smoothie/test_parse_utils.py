import pytest
from opentrons.drivers import utils
from opentrons.drivers.asyncio.smoothie import parse_utils
from opentrons.drivers.utils import ParseError


def test_parse_position_response():
    good_data = 'ok M114.2 X:10 Y:20 Z:30 A:40 B:50 C:60'
    res = parse_utils.parse_position_response(good_data)
    expected = {
        'X': 10,
        'Y': 20,
        'Z': 30,
        'A': 40,
        'B': 50,
        'C': 60,
    }
    assert res == expected


@pytest.mark.parametrize(
    argnames=["data"],
    argvalues=[
        [""],
        ["ok M114.2 X:10 Y:20: Z:30A:40 B:50 C:60"],
        ['ok M114.2 X:10 Y:20: Z:30 A:40 B:50']
    ]
)
def test_parse_position_response_error(data: str):
    with pytest.raises(ParseError):
        parse_utils.parse_position_response(data)


def test_parse_pipette_data():
    msg = 'TestsRule!!'
    mount = 'L'
    good_data = mount + ': ' + utils.string_to_hex(msg)
    parsed = parse_utils.parse_instrument_data(
        good_data).get(mount)
    assert parsed.decode() == msg


@pytest.mark.parametrize(
    argnames=["data"],
    argvalues=[
        [""],
        ['X:'],
        ['X:4049'],
        ['L:0.212'],
    ]
)
def test_parse_pipette_data_error(data: str):
    with pytest.raises(ParseError):
        parse_utils.parse_instrument_data(data)
