"""Hall sensor driver tests."""

import math
from unittest.mock import MagicMock

import pytest

from hardware_testing.drivers.hall_sensor.driver import HallEffectSensor


def test_convert_to_angle_handles_missing_field() -> None:
    """It should return None for invalid or missing magnetic field data."""
    sensor = HallEffectSensor(port="")

    assert sensor.convert_to_angle(None) is None
    assert sensor.convert_to_angle((1.0, 2.0, 3.0)) == pytest.approx(
        math.degrees(math.atan2(2.0, 3.0))
    )


def test_read_sensor_returns_csv_string_for_parser() -> None:
    """It should return a CSV string that matches the parser's contract."""
    sensor = HallEffectSensor(port="COM1")
    sensor.connection = MagicMock()
    sensor.connection.readline.return_value = b"1.5,2.5,3.5\r\n"

    assert sensor.read_sensor() == "1.5,2.5,3.5"
    assert sensor.parse_data(sensor.read_sensor()) == (1.5, 2.5, 3.5)
