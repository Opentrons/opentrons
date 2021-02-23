from typing import Dict
import pytest
from opentrons.drivers import utils


@pytest.mark.parametrize(
    argnames=['input_str', 'expected_result'],
    argvalues=[
        ['version:123-2 serial:serial_v model:m',
         {'version': '123-2', 'serial': 'serial_v', 'model': 'm'}],
        ['serial:serial_v model:m version:123-2 ',
         {'version': '123-2', 'serial': 'serial_v', 'model': 'm'}],
        ['   serial:serial_v model:m    version:123-2   ',
         {'version': '123-2', 'serial': 'serial_v', 'model': 'm'}]
    ]
)
def test_parse_device_information_success(
        input_str: str, expected_result: Dict[str, str]) -> None:
    """Test parse device information."""
    assert utils.parse_device_information(input_str) == expected_result


@pytest.mark.parametrize(
    argnames=['input_str'],
    argvalues=[
        ['version:123 serial:serial_v'],
        ['version:123 serialg:serial_v model:123'],
        [''],
        [None]
    ]
)
def test_parse_device_information_failure(input_str: str) -> None:
    """Test parse device information."""
    with pytest.raises(utils.ParseError):
        utils.parse_device_information(input_str)


