"""Helpers for flagging unsafe movements around a Heater-Shaker Module."""

from typing import List, Optional

from opentrons.motion_planning.adjacent_slots_getters import (
    get_east_west_slots,
    get_north_south_slots,
)

from ..errors import (
    PipetteMovementRestrictedByHeaterShakerError,
    HeaterShakerLabwareLatchNotOpenError,
    WrongModuleTypeError,
)
from ..state import StateStore
from ..types import HeaterShakerMovementRestrictors, LabwareLocation, ModuleLocation
from ...hardware_control import HardwareControlAPI
from ...hardware_control.modules import HeaterShaker as HardwareHeaterShaker
from ...drivers.types import HeaterShakerLabwareLatchStatus


def raise_if_movement_restricted(
    hs_movement_restrictors: List[HeaterShakerMovementRestrictors],
    destination_slot: int,
    is_multi_channel: bool,
    destination_is_tip_rack: bool,
) -> None:
    """Flag restricted movement around/to a Heater-Shaker."""
    for hs_movement_restrictor in hs_movement_restrictors:
        dest_east_west = destination_slot in get_east_west_slots(
            hs_movement_restrictor.deck_slot
        )
        dest_north_south = destination_slot in get_north_south_slots(
            hs_movement_restrictor.deck_slot
        )
        dest_heater_shaker = destination_slot == hs_movement_restrictor.deck_slot

        # If Heater-Shaker is running, can't move to or around it
        if (
            any([dest_east_west, dest_north_south, dest_heater_shaker])
            and hs_movement_restrictor.plate_shaking
        ):
            raise PipetteMovementRestrictedByHeaterShakerError(
                "Cannot move pipette to Heater-Shaker or adjacent slot while module is shaking"
            )

        # If Heater-Shaker's latch is open, can't move to it or east and west of it
        elif (
            dest_east_west or dest_heater_shaker
        ) and not hs_movement_restrictor.latch_closed:
            raise PipetteMovementRestrictedByHeaterShakerError(
                "Cannot move pipette to Heater-Shaker or adjacent slot to the left or right while labware latch is open"
            )

        elif is_multi_channel:
            # Can't go to east/west slot under any circumstances if pipette is multi-channel
            if dest_east_west:
                raise PipetteMovementRestrictedByHeaterShakerError(
                    "Cannot move 8-Channel pipette to slot adjacent to the left or right of Heater-Shaker"
                )
            # Can only go north/south if the labware is a tip rack
            elif dest_north_south and not destination_is_tip_rack:
                raise PipetteMovementRestrictedByHeaterShakerError(
                    "Cannot move 8-Channel pipette to non-tip-rack labware directly in front of or behind a Heater-Shaker"
                )


class HeaterShakerMovementFlagger:
    """A helper for flagging unsafe movements to a Heater-Shaker."""

    def __init__(
        self, state_store: StateStore, hardware_api: HardwareControlAPI
    ) -> None:
        self._state_store = state_store
        self._hardware_api = hardware_api

    async def raise_if_labware_latched_on_heater_shaker(
        self, labware_parent: LabwareLocation
    ) -> None:
        """Flag unsafe movements to a heater-shaker.

        If the given labware is on a heater-shaker, and that heater-shaker's labware
        latch is not open according to the engine's h/s state as well as the
        hardware API (for non-virtual modules), raises HeaterShakerLabwareLatchNotOpenError.
        If it is a virtual module, checks only for heater-shaker latch state in engine.

        Otherwise, no-ops.
        """
        if isinstance(labware_parent, ModuleLocation):
            module_id = labware_parent.moduleId
        else:
            return  # Labware not on a module.
        try:
            hs_substate = self._state_store.modules.get_heater_shaker_module_substate(
                module_id=module_id
            )
        except WrongModuleTypeError:
            return  # Labware on a module, but not a Heater-Shaker.

        if hs_substate.is_labware_latch_closed:
            # TODO (spp, 2022-10-27): This only raises if latch status is 'idle_closed'.
            #  We need to update the flagger to raise if latch status is anything other
            #  than 'idle_open'
            raise HeaterShakerLabwareLatchNotOpenError(
                "Heater-Shaker labware latch must be open when moving labware to/from it."
            )

        # There is a chance that the engine might not have the latest latch status;
        # do a hardware state check to be sure that the latch is truly open
        if not self._state_store.config.use_virtual_modules:
            try:
                hs_latch_status = await self._get_hardware_heater_shaker_latch_status(
                    module_id=hs_substate.module_id
                )
            except self._HardwareHeaterShakerMissingError as e:
                raise HeaterShakerLabwareLatchNotOpenError(
                    "H/S labware latch must be open when moving a labware on it,"
                    " but can't confirm its current status."
                ) from e

            if hs_latch_status != HeaterShakerLabwareLatchStatus.IDLE_OPEN:
                raise HeaterShakerLabwareLatchNotOpenError(
                    f"H/S latch must be open when moving a labware on it,"
                    f" but the latch is currently {hs_latch_status}"
                )

    async def _get_hardware_heater_shaker_latch_status(
        self,
        module_id: str,
    ) -> HeaterShakerLabwareLatchStatus:
        """Get latch status of the hardware H/S corresponding with the module ID.

        Returns:
            Latch status of the requested attached heater-shaker.

        Raises:
            _HardwareHeaterShakerMissingError: If we can't find that H/S in
                the hardware API, so we can't fetch its current latch status.
                It's unclear if this can happen in practice...
                maybe if the module disconnects between when it was loaded into
                Protocol Engine and when this function is called?
        """
        hs_serial = self._state_store.modules.get_serial_number(module_id=module_id)
        heater_shaker = await self._find_heater_shaker_by_serial(
            serial_number=hs_serial
        )
        if heater_shaker is None:
            raise self._HardwareHeaterShakerMissingError(
                f"No Heater-Shaker found with serial number {hs_serial}"
            )

        latch_status = heater_shaker.labware_latch_status
        # An attached H/S should always have latch status unless it's in error or
        # it was just connected and hasn't been polled for status yet.
        assert latch_status is not None, (
            "Did not receive a valid latch status from heater-shaker. "
            "Cannot verify safe labware movement."
        )
        return latch_status

    async def _find_heater_shaker_by_serial(
        self, serial_number: str
    ) -> Optional[HardwareHeaterShaker]:
        """Find the hardware H/S with the given serial number.

        Returns:
            The matching hardware H/S, or None if none was found.
        """
        for module in self._hardware_api.attached_modules:
            # Different module types have different keys under .device_info.
            # Heater-Shaker should always have .device_info["serial"].
            if (
                isinstance(module, HardwareHeaterShaker)
                and module.device_info["serial"] == serial_number
            ):
                return module
        return None

    class _HardwareHeaterShakerMissingError(Exception):
        pass
