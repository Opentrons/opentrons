from typing import Dict
import pytest
from opentrons.drivers import utils
from opentrons.drivers.types import (
    Temperature,
    PlateTemperature,
    RPM,
    HeaterShakerPlateLockStatus,
)


@pytest.mark.parametrize(
    argnames=["input_str", "expected_result"],
    argvalues=[
        [
            "version:123-2 serial:serial_v model:m",
            {"version": "123-2", "serial": "serial_v", "model": "m"},
        ],
        [
            "serial:serial_v model:m version:123-2 ",
            {"version": "123-2", "serial": "serial_v", "model": "m"},
        ],
        [
            "   serial:serial_v model:m    version:123-2   ",
            {"version": "123-2", "serial": "serial_v", "model": "m"},
        ],
        [
            "something:extra serial:serial_v model:m version:123-2",
            {"version": "123-2", "serial": "serial_v", "model": "m"},
        ],
    ],
)
def test_parse_device_information_success(
    input_str: str, expected_result: Dict[str, str]
) -> None:
    """Test parse device information."""
    assert utils.parse_device_information(input_str) == expected_result


@pytest.mark.parametrize(
    argnames=["input_str"],
    argvalues=[
        ["version:123 serial:serial_v"],
        ["version:123 serialg:serial_v model:123"],
        [""],
    ],
)
def test_parse_device_information_failure(input_str: str) -> None:
    """Test parse device information."""
    with pytest.raises(utils.ParseError):
        utils.parse_device_information(input_str)


@pytest.mark.parametrize(
    argnames=["input_str", "expected_result"],
    argvalues=[
        [
            "FW:123-2 SerialNo:serial_v HW:m",
            {"version": "123-2", "serial": "serial_v", "model": "m"},
        ],
        [
            "SerialNo:serial_v HW:m FW:123-2 ",
            {"version": "123-2", "serial": "serial_v", "model": "m"},
        ],
        [
            "   SerialNo:serial_v HW:m    FW:123-2   ",
            {"version": "123-2", "serial": "serial_v", "model": "m"},
        ],
        [
            "something:extra SerialNo:serial_v HW:m FW:123-2",
            {"version": "123-2", "serial": "serial_v", "model": "m"},
        ],
    ],
)
def test_parse_hs_device_information_success(
    input_str: str, expected_result: Dict[str, str]
) -> None:
    """Test parse device information."""
    assert utils.parse_hs_device_information(input_str) == expected_result


@pytest.mark.parametrize(
    argnames=["input_str"],
    argvalues=[
        ["FW:123 SerialNo:serial_v"],
        ["FW:123 SerialNog:serial_v HW:123"],
        [""],
    ],
)
def test_parse_hs_device_information_failure(input_str: str) -> None:
    """Test parse device information."""
    with pytest.raises(utils.ParseError):
        utils.parse_hs_device_information(input_str)


@pytest.mark.parametrize(
    argnames=["input_str", "expected_result", "zero_is_none"],
    argvalues=[
        ["T:none C:123.4", Temperature(target=None, current=123.4), False],
        ["T:123.566 C:123.446", Temperature(target=123.57, current=123.45), False],
        ["T:-123.566 C:-123.446", Temperature(target=-123.57, current=-123.45), False],
        ["a:3 T:2. C:3 H:0 G:1", Temperature(target=2, current=3), False],
        ["T:0 C:124", Temperature(target=0, current=124), False],
        ["T:0 C:124", Temperature(target=None, current=124), True],
    ],
)
def test_parse_temperature_response_success(
    input_str: str, expected_result: Temperature, zero_is_none: bool
) -> None:
    """It should parse temperature response."""
    assert (
        utils.parse_temperature_response(
            input_str, 2, zero_target_is_unset=zero_is_none
        )
        == expected_result
    )


@pytest.mark.parametrize(
    argnames=["input_str"],
    argvalues=[
        ["T:not_a_float C:123"],
        ["T:none C:none"],
        ["C:not_a_float T:123"],
        [""],
    ],
)
def test_parse_temperature_response_failure(input_str: str) -> None:
    """It should fail to parse temperature response."""
    with pytest.raises(utils.ParseError):
        utils.parse_temperature_response(input_str, 2)


@pytest.mark.parametrize(
    argnames=["input_str", "expected_result"],
    argvalues=[
        ["T:0 C:500", RPM(target=None, current=500)],
        ["T:25 C:24", RPM(target=25, current=24)],
        ["a:3 T:2. C:3 H:0 G:1", RPM(target=2, current=3)],
    ],
)
def test_parse_rpm_response_success(input_str: str, expected_result: RPM) -> None:
    """It should parse temperature response."""
    assert utils.parse_rpm_response(input_str) == expected_result


@pytest.mark.parametrize(
    argnames=["input_str"],
    argvalues=[
        ["T:not_an_int C:123"],
        ["T:none C:none"],
        ["C:not_an_int T:123"],
        [""],
    ],
)
def test_parse_rpm_response_failure(input_str: str) -> None:
    """It should fail to parse temperature response."""
    with pytest.raises(utils.ParseError):
        utils.parse_rpm_response(input_str)


@pytest.mark.parametrize(
    argnames=["input_str", "expected_result"],
    argvalues=[
        ["STATUS:IDLE_OPEN", HeaterShakerPlateLockStatus.IDLE_OPEN],
        ["STATUS:IDLE_CLOSED", HeaterShakerPlateLockStatus.IDLE_CLOSED],
        ["a:safa STATUS:IDLE_UNKNOWN", HeaterShakerPlateLockStatus.IDLE_UNKNOWN],
    ],
)
def test_parse_plate_lock_status_response_success(
    input_str: str, expected_result: HeaterShakerPlateLockStatus
):
    assert utils.parse_plate_lock_status_response(input_str) == expected_result


@pytest.mark.parametrize(
    argnames=["input_str"],
    argvalues=[
        [""],
        ["SSSSSS:IDLE_OPEN"],
        ["STATUS:Lord Humongous Sees You"],
        ["IDLE_OPEN"],
        ["STATUS"],
        [":"],
    ],
)
def test_parse_plate_lock_status_response_failure(input_str):
    with pytest.raises(utils.ParseError):
        utils.parse_plate_lock_status_response(input_str)


@pytest.mark.parametrize(
    argnames=["input_str", "expected_result"],
    argvalues=[
        ["T:none C:0 H:none", PlateTemperature(target=None, current=0, hold=None)],
        [
            "T:321.4 C:45 H:123.222",
            PlateTemperature(target=321.4, current=45, hold=123.22),
        ],
        [
            "T:-44.2442 C:-22.233 H:0",
            PlateTemperature(target=-44.24, current=-22.23, hold=0),
        ],
        ["a:3 T:2. C:3 H:0 G:1", PlateTemperature(target=2, current=3, hold=0)],
    ],
)
def test_parse_plate_temperature_response_success(
    input_str: str, expected_result: PlateTemperature
) -> None:
    """It should parse plate temperature response"""
    assert utils.parse_plate_temperature_response(input_str, 2) == expected_result


@pytest.mark.parametrize(
    argnames=["input_str"],
    argvalues=[
        ["T:not_a_float C:123 H:321"],
        ["C:not_a_float T:123 H:321"],
        ["H:not_a_float C:123 T:321"],
        [""],
    ],
)
def test_parse_plate_temperature_response_failure(input_str: str) -> None:
    """It should fail to parse plate temperature response"""
    with pytest.raises(utils.ParseError):
        utils.parse_plate_temperature_response(input_str, 2)


@pytest.mark.parametrize(
    argnames=["input_str", "min_length", "expected"],
    argvalues=[
        ["", 0, ""],
        ["", 1, "0"],
        ["abcd", 12, "616263640000"],
        ["abcd", 5, "61626364"],
    ],
)
def test_string_to_hex(input_str: str, min_length: int, expected: str) -> None:
    """It should convert string to hex with padding to reach min_length."""
    assert expected == utils.string_to_hex(val=input_str, min_length=min_length)
