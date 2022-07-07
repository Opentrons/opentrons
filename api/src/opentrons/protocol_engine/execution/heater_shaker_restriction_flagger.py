"""Helpers for flagging unsafe movements around a heater-shaker Module."""

from opentrons.types import DeckSlotName
from opentrons.hardware_control import HardwareControlAPI

from ..types import ModuleModel, LoadedModule
from ..state import StateStore
from ..errors import RestrictedPipetteMovementError


class HeaterShakerMovementFlagger:
    """A helper for flagging unsafe movements around a Heater-Shaker Module.

    This is only intended for use by MovementHandler.
    It's a separate class for independent testability.
    """

    def __init__(
        self, state_store: StateStore, hardware_api: HardwareControlAPI
    ) -> None:
        """Initialize the HeaterShakerMovementFlagger.

        Args:
            state_store: The Protocol Engine state store interface. Used to figure out
                         modules on deck, deck location, module substate, and
                         getting pipette data
            hardware_api: The underlying hardware interface. Used for getting
                          hardware pipette object.
        """
        self._state_store = state_store
        self._hardware_api = hardware_api

    async def raise_if_movement_restricted(
        self, labware_id: str, pipette_id: str
    ) -> None:
        """Flag restricted movement around/to a Heater-Shaker."""
        heater_shaker_modules = [
            module
            for module in self._state_store.modules.get_all()
            if module.model == ModuleModel.HEATER_SHAKER_MODULE_V1
        ]
        for heater_shaker_module in heater_shaker_modules:
            hs_module_substate = (
                self._state_store.modules.get_heater_shaker_module_substate(
                    module_id=heater_shaker_module.id
                )
            )
            heater_shaker_slot_int = int(self._resolve_location(heater_shaker_module))
            dest_slot_int = int(
                self._state_store.geometry.get_ancestor_slot_name(labware_id)
            )

            dest_east_west = self._is_east_or_west(
                heater_shaker_slot_int, dest_slot_int
            )
            dest_north_south = self._is_north_south(
                heater_shaker_slot_int, dest_slot_int
            )
            dest_heater_shaker = dest_slot_int == heater_shaker_slot_int

            if any([dest_east_west, dest_north_south, dest_heater_shaker]):
                # If heater-shaker is running, can't move to or around it
                if hs_module_substate.is_plate_shaking:
                    raise RestrictedPipetteMovementError(
                        "Cannot move pipette to adjacent slot while Heater-Shaker is shaking"
                    )

                # If heater-shaker's latch is open, can't move to it or east and west of it
                elif not hs_module_substate.is_labware_latch_closed and (
                    dest_east_west or dest_heater_shaker
                ):
                    raise RestrictedPipetteMovementError(
                        "Cannot move pipette east or west of or to Heater-Shaker while latch is open"
                    )

                hw_pipette = self._state_store.pipettes.get_hardware_pipette(
                    pipette_id=pipette_id,
                    attached_pipettes=self._hardware_api.attached_instruments,
                )

                if hw_pipette.config["channels"] > 1:
                    # Can't go to east/west slot under any circumstances if pipette is multi-channel
                    if dest_east_west:
                        raise RestrictedPipetteMovementError(
                            "Cannot move multi-channel pipette east or west of Heater-Shaker"
                        )
                    # Can only go north/south if the labware is a tiprack
                    elif dest_north_south and not self._state_store.labware.is_tiprack(
                        labware_id
                    ):
                        raise RestrictedPipetteMovementError(
                            "Cannot move multi-channel pipette north or south of Heater-Shaker to non-tiprack labware"
                        )

    def _resolve_location(self, module: LoadedModule) -> DeckSlotName:
        if module.location is not None:
            return module.location.slotName
        else:
            return self._state_store.modules.get_location(module.id).slotName

    @staticmethod
    def _is_east_or_west(hs_location: int, dest_location: int) -> bool:
        if hs_location in {1, 4, 7, 10}:
            return dest_location == hs_location + 1
        elif hs_location in {2, 5, 8, 11}:
            return dest_location == hs_location - 1 or dest_location == hs_location + 1
        else:
            return dest_location == hs_location - 1

    @staticmethod
    def _is_north_south(hs_location: int, dest_location: int) -> bool:
        if hs_location in {1, 2, 3}:
            return dest_location == hs_location + 3
        elif hs_location in {4, 5, 6, 7, 8, 9}:
            return dest_location == hs_location - 3 or dest_location == hs_location + 3
        else:
            return dest_location == hs_location - 3
