"""Temperature module sub-state."""

from dataclasses import dataclass
from typing import NewType, NamedTuple

from opentrons.protocol_engine.types import TemperatureModuleModel
from opentrons.protocol_engine.errors import InvalidTargetTemperatureError

TemperatureModuleId = NewType("TemperatureModuleId", str)


class TemperatureRange(NamedTuple):
    """Minimum and maximum allowed temperatures for a heating module."""

    min: float
    max: float


# TODO (spp, 2022-03-22): Move these values to temperature module definition.
TEMP_MODULE_TEMPERATURE_RANGE = TemperatureRange(min=-9, max=99)


@dataclass(frozen=True)
class TemperatureModuleSubState:
    """Temperature Module specific state.

    Provides calculations and read-only state access
    for an individual loaded Temperaute Module.
    """

    module_id: TemperatureModuleId

    @staticmethod
    def validate_target_temperature(celsius: float) -> int:
        """Verify target temperature is within range and convert to int."""
        celsius_int = int(round(celsius, 0))
        if (TEMP_MODULE_TEMPERATURE_RANGE.min
                <= celsius_int
                <= TEMP_MODULE_TEMPERATURE_RANGE.max
        ):
            return celsius_int
        else:
            raise InvalidTargetTemperatureError(
                f"Temperature module got an invalid temperature {celsius} °C."
                f" Valid range is {TEMP_MODULE_TEMPERATURE_RANGE}."
            )
