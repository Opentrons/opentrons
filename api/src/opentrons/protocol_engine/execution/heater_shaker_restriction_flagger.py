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
                raise self._HardwareHeaterShakerMissingError(
                    f'No Heater Shaker found with serial number "{heater_shaker_module.serialNumber}".'
                )

            # TODO will this work in simulation?
            hw_pipette = self._state_store.pipettes.get_hardware_pipette(
                pipette_id=pipette_id,
                attached_pipettes=self._hardware_api.attached_instruments,
            )

            heater_shaker_slot_int = int(self._resolve_location(heater_shaker_module))
            dest_slot_int = int(
                self._state_store.geometry.get_ancestor_slot_name(labware_id)
            )

            if hw_pipette.config["channels"] > 1:
                # Can't go to east/west slot under any circumstances if pipette is multi-channel
                if dest_slot_int in self._get_east_west_locations(
                    heater_shaker_slot_int
                ):
                    raise HeaterShakerMovementRestrictionError(
                        "Cannot move multi-channel pipette east or west of Heater Shaker"
                    )
                # Can only go north/west if the labware is a tiprack
                elif dest_slot_int in self._get_north_south_locations(
                    heater_shaker_slot_int
                ) and not self._state_store.labware.is_tiprack(labware_id):
                    raise HeaterShakerMovementRestrictionError(
                        "Cannot move multi-channel pipette north or south of Heater Shaker to non-tiprack labware"
                    )
            else:
                # If heater shaker is running, can't move in any cardinal direction of it
                if heater_shaker_hardware.status == HeaterShakerStatus.RUNNING:
                    if dest_slot_int in self._get_east_west_locations(
                        heater_shaker_slot_int
                    ) or dest_slot_int in self._get_north_south_locations(
                        heater_shaker_slot_int
                    ):
                        raise HeaterShakerMovementRestrictionError(
                            "Cannot move single-channel pipette to adjacent slot while Heater Shaker is shaking"
                        )
                # If heater shaker's latch is open, can't move to it or east and west of it
                elif (
                    heater_shaker_hardware.labware_latch_status
                    != HeaterShakerLabwareLatchStatus.IDLE_CLOSED
                    and (
                        dest_slot_int == heater_shaker_slot_int
                        or dest_slot_int
                        in self._get_east_west_locations(heater_shaker_slot_int)
                    )
                ):
                    raise HeaterShakerMovementRestrictionError(
                        "Cannot move single-channel pipette east or west of Heater Shaker while latch is open"
                    )

    def _resolve_location(self, module: LoadedModule) -> DeckSlotName:
        if module.location is not None:
            return module.location.slotName
        else:
            return self._state_store.geometry.get_ancestor_slot_name(module.id)

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
            # to avoid parsing a JSON definition every time a protocol when a
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
    def _get_east_west_locations(location: int) -> List[int]:
        if location in [1, 4, 7, 10]:
            return [location + 1]
        elif location in [2, 5, 8, 11]:
            return [location - 1, location + 1]
        else:
            return [location - 1]

    @staticmethod
    def _get_north_south_locations(location: int) -> List[int]:
        if location in [1, 2, 3]:
            return [location + 3]
        elif location in [4, 5, 6, 7, 8, 9]:
            return [location - 3, location + 3]
        else:
            return [location - 3]

    class _HardwareHeaterShakerMissingError(Exception):
        pass
