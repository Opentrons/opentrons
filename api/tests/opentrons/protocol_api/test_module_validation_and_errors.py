import pytest

from opentrons.protocol_api.module_validation_and_errors import (
    validate_heater_shaker_temperature,
    validate_heater_shaker_speed,
    InvalidTargetTemperatureError,
    InvalidTargetSpeedError,
)


@pytest.mark.parametrize("valid_celsius_value", [37.0, 37.1, 50, 94.99, 95])
def test_validate_heater_shaker_temperature(valid_celsius_value: float) -> None:
    """It should return the validated temperature value."""
    validated = validate_heater_shaker_temperature(celsius=valid_celsius_value)
    assert validated == valid_celsius_value


@pytest.mark.parametrize("invalid_celsius_value", [-1, 0, 36.99, 95.01])
def test_validate_heater_shaker_temperature_raises(
    invalid_celsius_value: float,
) -> None:
    """It should raise an error for invalid temperature values."""
    with pytest.raises(InvalidTargetTemperatureError):
        validate_heater_shaker_temperature(celsius=invalid_celsius_value)


@pytest.mark.parametrize("valid_rpm_value", [200, 201, 1000, 2999, 3000])
def test_validate_heater_shaker_speed(valid_rpm_value: int) -> None:
    """It should return the validated speed value."""
    validated = validate_heater_shaker_speed(rpm=valid_rpm_value)
    assert validated == valid_rpm_value


@pytest.mark.parametrize("invalid_rpm_value", [0, 199, 3001])
def test_validate_heater_shaker_speed_raises(invalid_rpm_value: int) -> None:
    """It should raise an error for invalid speed values."""
    with pytest.raises(InvalidTargetSpeedError):
        validate_heater_shaker_speed(rpm=invalid_rpm_value)
