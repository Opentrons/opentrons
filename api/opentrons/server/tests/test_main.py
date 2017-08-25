from opentrons.server import main
import pytest


async def test_parse_address():
    assert main.parse_address('127.0.0.1:31950') == ('127.0.0.1', 31950)
    assert main.parse_address('127.0.0.1') == ('127.0.0.1', None)
    with pytest.raises(ValueError):
        assert main.parse_address('127.0.0.1:')
    with pytest.raises(ValueError):
        assert main.parse_address('127.0.0')
    with pytest.raises(ValueError):
        assert main.parse_address('127.0.0.256')


async def test_main():
    assert main.parse_command_line(['', '127.0.0.1:31950']) == \
        ('127.0.0.1', 31950)

    assert main.parse_command_line(['']) == \
        ('127.0.0.1', 31950)
