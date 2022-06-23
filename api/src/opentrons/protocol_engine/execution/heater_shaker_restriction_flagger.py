"""Helpers for flagging unsafe movements around a heater shaker Module."""


from typing import List, Optional

from opentrons.types import DeckSlotName
from opentrons.hardware_control.modules.types import (
    # Renamed to avoid conflicting with ..types.ModuleModel.
    ModuleType as OpentronsModuleType,
    HeaterShakerModuleModel as OpentronsHeaterShakerModuleModel,
)
from opentrons.drivers.types import HeaterShakerLabwareLatchStatus
from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.modules import (
    AbstractModule as AbstractHardwareModule,
    HeaterShaker as HardwareHeaterShaker,
)
from opentrons.hardware_control.modules.types import HeaterShakerStatus

from ..types import ModuleModel, LoadedModule
from ..state import StateStore
from ..errors import HeaterShakerMovementRestrictionError


class HeaterShakerMovementFlagger:
    """A helper for flagging unsafe movements around a Heater Shaker Module.

    This is only intended for use by MovementHandler.
    It's a separate class for independent testability.
    """

    def __init__(
        self, state_store: StateStore, hardware_api: HardwareControlAPI
    ) -> None:
        """Initialize the HeaterShakerMovementFlagger.

        Args:
            state_store: The Protocol Engine state store interface. Used to figure out
                         modules on deck, deck location, and getting pipette data
            hardware_api: The underlying hardware interface. Used to query
                          Heater Shaker's current states.
        """
        self._state_store = state_store
        self._hardware_api = hardware_api

    async def raise_if_movement_restricted(
        self, labware_id: str, pipette_id: str
    ) -> None:
        """Flag restricted movement around/to a Heater Shaker."""
        all_modules = self._state_store.modules.get_all()
        heater_shaker_module = next(
            (
                module
                for module in all_modules
                if module.model == ModuleModel.HEATER_SHAKER_MODULE_V1
            ),
            None,
        )

        if heater_shaker_module is not None:
            heater_shaker_hardware = await self._find_heater_shaker_by_serial(
                heater_shaker_module.serialNumber
            )
            if heater_shaker_hardware is None:
                raise HeaterShakerMovementRestrictionError(
                    f"Cannot resolve heater-shaker movement restrictions."
                    f' No Heater Shaker found with serial number "{heater_shaker_module.serialNumber}".'
                )

            heater_shaker_slot_int = int(self._resolve_location(heater_shaker_module))
            dest_slot_int = int(
                self._state_store.geometry.get_ancestor_slot_name(labware_id)
            )

            dest_east_west = self._is_east_or_west(heater_shaker_slot_int, dest_slot_int)
            dest_north_south = self._is_north_south(heater_shaker_slot_int, dest_slot_int)
            dest_heater_shaker = dest_slot_int == heater_shaker_slot_int

            if any([dest_east_west, dest_north_south, dest_heater_shaker]):
                # If heater shaker is running, can't move in any cardinal direction of it
                if heater_shaker_hardware.status != HeaterShakerStatus.IDLE and (
                    dest_east_west or dest_north_south
                ):
                    raise HeaterShakerMovementRestrictionError(
                        "Cannot move pipette to adjacent slot while Heater Shaker is shaking"
                    )

                # If heater shaker's latch is open, can't move to it or east and west of it
                elif (
                    heater_shaker_hardware.labware_latch_status
                    != HeaterShakerLabwareLatchStatus.IDLE_CLOSED
                    and (dest_east_west or dest_heater_shaker)
                ):
                    raise HeaterShakerMovementRestrictionError(
                        "Cannot move pipette east or west of or to Heater Shaker while latch is open"
                    )

                # TODO will this work in simulation?
                hw_pipette = self._state_store.pipettes.get_hardware_pipette(
                    pipette_id=pipette_id,
                    attached_pipettes=self._hardware_api.attached_instruments,
                )

                if hw_pipette.config["channels"] > 1:
                    # Can't go to east/west slot under any circumstances if pipette is multi-channel
                    if dest_east_west:
                        raise HeaterShakerMovementRestrictionError(
                            "Cannot move multi-channel pipette east or west of Heater Shaker"
                        )
                    # Can only go north/west if the labware is a tiprack
                    elif dest_north_south and not self._state_store.labware.is_tiprack(
                        labware_id
                    ):
                        raise HeaterShakerMovementRestrictionError(
                            "Cannot move multi-channel pipette north or south of Heater Shaker to non-tiprack labware"
                        )

    def _resolve_location(self, module: LoadedModule) -> DeckSlotName:
        if module.location is not None:
            return module.location.slotName
        else:
            return self._state_store.modules.get_location(module.id)

    async def _find_heater_shaker_by_serial(
        self, serial_number: str
    ) -> Optional[HardwareHeaterShaker]:
        """Find the hardware Heater Shaker with the given serial number.

        Returns:
            The matching hardware Heater Shaker, or None if none was found.
        """
        available_modules, simulating_module = await self._hardware_api.find_modules(
            by_model=OpentronsHeaterShakerModuleModel.HEATER_SHAKER_V1,
            # Hard-coding instead of using
            # opentrons.protocols.geometry.module_geometry.resolve_module_type(),
            # to avoid parsing a JSON definition every time a protocol runs when a
            # heater shaker is on the deck
            resolved_type=OpentronsModuleType.HEATER_SHAKER,
        )

        modules_to_check: List[AbstractHardwareModule] = (
            available_modules if simulating_module is None else [simulating_module]
        )

        for module in modules_to_check:
            # Different module types have different keys under .device_info.
            # Heater shakers should always have .device_info["serial"].
            if (
                isinstance(module, HardwareHeaterShaker)
                and module.device_info["serial"] == serial_number
            ):
                return module
        return None

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
