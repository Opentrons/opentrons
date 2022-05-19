"""Thermocycler Module sub-state."""
from dataclasses import dataclass
from typing import NewType

from opentrons.protocol_engine.errors import (
    InvalidTargetTemperatureError,
    InvalidBlockVolumeError,
)

# TODO(mc, 2022-04-25): move to module definition
# https://github.com/Opentrons/opentrons/issues/9800
from opentrons.drivers.thermocycler.driver import (
    BLOCK_TARGET_MIN,
    BLOCK_TARGET_MAX,
    BLOCK_VOL_MIN,
    BLOCK_VOL_MAX,
    LID_TARGET_MIN,
    LID_TARGET_MAX,
)

ThermocyclerModuleId = NewType("ThermocyclerModuleId", str)


@dataclass(frozen=True)
class ThermocyclerModuleSubState:
    """Thermocycler-specific state.

    Provides calculations and read-only state access
    for an individual loaded Thermocycler Module.
    """

    module_id: ThermocyclerModuleId

    @staticmethod
    def validate_target_block_temperature(celsius: float) -> float:
        """Validate a given target block temperature.

        Args:
            celsius: The requested block temperature.

        Raises:
            InvalidTargetTemperatureError: The given temperature
                is outside the thermocycler's operating range.

        Returns:
            The validated temperature in degrees Celsius.
        """
        if BLOCK_TARGET_MIN <= celsius <= BLOCK_TARGET_MAX:
            return celsius

        raise InvalidTargetTemperatureError(
            "Thermocycler block temperature must be between"
            f" {BLOCK_TARGET_MIN} and {BLOCK_TARGET_MAX}, but got {celsius}."
        )

    @staticmethod
    def validate_max_block_volume(volume: float) -> float:
        """Validate a given target block max volume.

        Args:
            volume: The requested block max volume in uL.

        Raises:
            InvalidBlockVolumeError: The given volume
                is outside the thermocycler's operating range.

        Returns:
            The validated volume in uL.
        """
        if BLOCK_VOL_MIN <= volume <= BLOCK_VOL_MAX:
            return volume

        raise InvalidBlockVolumeError(
            "Thermocycler max block volume must be between"
            f" {BLOCK_VOL_MIN} and {BLOCK_VOL_MAX}, but got {volume}."
        )

    @staticmethod
    def validate_target_lid_temperature(celsius: float) -> float:
        """Validate a given target lid temperature.

        Args:
            celsius: The requested lid temperature.

        Raises:
            InvalidTargetTemperatureError: The given temperature
                is outside the thermocycler's operating range.

        Returns:
            The validated temperature in degrees Celsius.
        """
        if LID_TARGET_MIN <= celsius <= LID_TARGET_MAX:
            return celsius

        raise InvalidTargetTemperatureError(
            "Thermocycler lid temperature must be between"
            f" {LID_TARGET_MIN} and {LID_TARGET_MAX}, but got {celsius}."
        )
