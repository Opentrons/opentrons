import pytest

from opentrons.drivers.smoothie_drivers import util


def test_parse_position_response(smoothie):
    good_data = 'ok M114.2 X:10 Y:20: Z:30 A:40 B:50 C:60'
    bad_data = 'ok M114.2 X:10 Y:20: Z:30A:40 B:50 C:60'
    res = util.parse_position_response(good_data)
    expected = {
        'X': 10,
        'Y': 20,
        'Z': 30,
        'A': 40,
        'B': 50,
        'C': 60,
    }
    assert res == expected
    with pytest.raises(util.ParseError):
        util.parse_position_response(bad_data)


def test_parse_pipette_data():
    msg = 'TestsRule!!'
    mount = 'L'
    good_data = mount + ': ' + util.byte_array_to_hex_string(msg.encode())
    parsed = util.parse_instrument_data(good_data).get(mount)
    assert parsed.decode() == msg
