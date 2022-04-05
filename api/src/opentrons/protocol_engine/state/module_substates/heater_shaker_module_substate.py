"""Heater-Shaker Module sub-state."""
from dataclasses import dataclass
from typing import NewType, Optional

from opentrons.protocol_engine.types import TemperatureRange, SpeedRange
from opentrons.protocol_engine.errors import (
    InvalidTargetTemperatureError,
    InvalidTargetSpeedError,
    NoTargetTemperatureSetError,
)

HeaterShakerModuleId = NewType("HeaterShakerModuleId", str)


# TODO (spp, 2022-03-22): Move these values to heater-shaker module definition.
HEATER_SHAKER_TEMPERATURE_RANGE = TemperatureRange(min=37, max=95)
HEATER_SHAKER_SPEED_RANGE = SpeedRange(min=200, max=3000)


@dataclass(frozen=True)
class HeaterShakerModuleSubState:
    """Heater-Shaker-specific state.

    Provides calculations and read-only state access
    for an individual loaded Heater-Shaker Module.
    """

    module_id: HeaterShakerModuleId
    plate_target_temperature: Optional[float]

    def get_plate_target_temperature(self) -> float:
        """Get the module's target plate temperature."""
        target = self.plate_target_temperature

        if target is None:
            raise NoTargetTemperatureSetError(
                f"Module {self.module_id} does not have a target temperature set."
            )
        return target

    @staticmethod
    def validate_target_temperature(celsius: float) -> float:
        """Verify that the target temperature being set is valid for heater-shaker."""
        if (
            HEATER_SHAKER_TEMPERATURE_RANGE.min
            <= celsius
            <= HEATER_SHAKER_TEMPERATURE_RANGE.max
        ):
            return celsius
        else:
            raise InvalidTargetTemperatureError(
                f"Heater-Shaker got an invalid temperature {celsius} degree Celsius."
                f" Valid range is {HEATER_SHAKER_TEMPERATURE_RANGE}."
            )

    @staticmethod
    def validate_target_speed(rpm: float) -> int:
        """Verify that the target speed is valid for heater-shaker & convert to int."""
        rpm_int = int(round(rpm, 0))
        if HEATER_SHAKER_SPEED_RANGE.min <= rpm <= HEATER_SHAKER_SPEED_RANGE.max:
            return rpm_int
        else:
            raise InvalidTargetSpeedError(
                f"Heater-Shaker got invalid speed of {rpm}RPM. Valid range is "
                f"{HEATER_SHAKER_SPEED_RANGE}."
            )
