"""Thermocycler Module sub-state."""
from dataclasses import dataclass
from typing import NewType

from opentrons.protocol_engine.errors import InvalidTargetTemperatureError

# TODO(mc, 2022-04-25): move to module definition
# https://github.com/Opentrons/opentrons/issues/9800
from opentrons.drivers.thermocycler.driver import BLOCK_TARGET_MIN, BLOCK_TARGET_MAX

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
