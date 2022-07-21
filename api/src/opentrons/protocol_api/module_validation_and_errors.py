"""Contains module command validation functions and module errors for heater-shaker."""

# TODO (spp, 2022-03-22): Move these values to heater-shaker module definition.
HEATER_SHAKER_TEMPERATURE_MIN = 37
HEATER_SHAKER_TEMPERATURE_MAX = 95
HEATER_SHAKER_SPEED_MIN = 200
HEATER_SHAKER_SPEED_MAX = 3000


class InvalidTargetTemperatureError(ValueError):
    """An error raised when attempting to set an invalid target temperature."""


class InvalidTargetSpeedError(ValueError):
    """An error raised when attempting to set an invalid target speed."""


def validate_heater_shaker_temperature(celsius: float) -> float:
    """Verify that the target temperature being set is valid for heater-shaker."""
    if HEATER_SHAKER_TEMPERATURE_MIN <= celsius <= HEATER_SHAKER_TEMPERATURE_MAX:
        return celsius
    else:
        raise InvalidTargetTemperatureError(
            f"Heater-Shaker got an invalid temperature {celsius} degree Celsius."
            f" Valid range is {HEATER_SHAKER_TEMPERATURE_MIN} ->"
            f" {HEATER_SHAKER_SPEED_MAX}."
        )


def validate_heater_shaker_speed(rpm: int) -> int:
    """Verify that the target speed is valid for heater-shaker"""
    if HEATER_SHAKER_SPEED_MIN <= rpm <= HEATER_SHAKER_SPEED_MAX:
        return rpm
    else:
        raise InvalidTargetSpeedError(
            f"Heater-Shaker got invalid speed of {rpm} rpm. Valid range is "
            f"{HEATER_SHAKER_SPEED_MIN} -> {HEATER_SHAKER_SPEED_MAX}."
        )
