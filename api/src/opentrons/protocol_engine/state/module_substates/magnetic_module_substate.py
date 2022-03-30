"""Magnetic module sub-state."""

from dataclasses import dataclass
from typing import NewType

from opentrons.protocol_engine.types import MagneticModuleModel, ModuleModel
from opentrons.protocol_engine.errors import EngageHeightOutOfRangeError
from opentrons.hardware_control.modules.magdeck import (
    engage_height_is_in_range,
    OFFSET_TO_LABWARE_BOTTOM as MAGNETIC_MODULE_OFFSET_TO_LABWARE_BOTTOM,
    MAX_ENGAGE_HEIGHT as MAGNETIC_MODULE_MAX_ENGAGE_HEIGHT,
)

MagneticModuleId = NewType("MagneticModuleId", str)


@dataclass(frozen=True)
class MagneticModuleSubState:
    """Magnetic Module specific state.

    Provides calculations and read-only state access
    for an individual loaded Magnetic Module.
    """

    module_id: MagneticModuleId
    model: MagneticModuleModel

    def calculate_magnet_hardware_height(self, mm_from_base: float) -> float:
        """Convert a human-friendly magnet height to be hardware-friendly.

        Args:
            mm_from_base: The height to convert. Measured in how far the tops
                of the magnets are above the labware base plane.

        Returns:
            The same height, with its units and origin point converted
            so that it's suitable to pass to `MagDeck.engage()`.

        Raises:
            EngageHeightOutOfRangeError: If modules of the given model are
                physically incapable of reaching the requested height.
        """
        hardware_units_from_base = (
            mm_from_base * 2
            if self.model == ModuleModel.MAGNETIC_MODULE_V1
            else mm_from_base
        )
        home_to_base_offset = MAGNETIC_MODULE_OFFSET_TO_LABWARE_BOTTOM[self.model]
        hardware_units_from_home = home_to_base_offset + hardware_units_from_base

        if not engage_height_is_in_range(
            model=self.model,
            height=hardware_units_from_home,
        ):
            # TODO(mm, 2022-03-02): This error message probably will not match how
            # the user specified the height. (Hardware units versus mm,
            # home as origin versus labware base as origin.) This may be confusing
            # depending on how it propagates up.
            raise EngageHeightOutOfRangeError(
                f"Invalid engage height for {self.model}:"
                f" {hardware_units_from_home}. Must be"
                f" 0 - {MAGNETIC_MODULE_MAX_ENGAGE_HEIGHT[self.model]}."
            )

        return hardware_units_from_home
