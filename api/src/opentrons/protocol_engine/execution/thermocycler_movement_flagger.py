"""Helpers for flagging unsafe movements to a Thermocycler Module."""

from typing import Optional

from opentrons.drivers.types import ThermocyclerLidStatus
from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.modules import Thermocycler as HardwareThermocycler

from ..types import ModuleLocation
from ..state import StateStore
from ..errors import ThermocyclerNotOpenError, WrongModuleTypeError


class ThermocyclerMovementFlagger:
    """A helper for flagging unsafe movements to a Thermocycler Module.

    This is only intended for use by MovementHandler.
    It's a separate class for independent testability.
    """

    def __init__(
        self, state_store: StateStore, hardware_api: HardwareControlAPI
    ) -> None:
        """Initialize the ThermocyclerMovementFlagger.

        Args:
            state_store: The Protocol Engine state store interface. Used to figure out
                         which Thermocycler a labware is in, if any.
            hardware_api: The underlying hardware interface. Used to query
                          Thermocyclers' current lid states.
        """
        self._state_store = state_store
        self._hardware_api = hardware_api

    async def raise_if_labware_in_non_open_thermocycler(self, labware_id: str) -> None:
        """Flag unsafe movements to a Thermocycler.

        If the given labware is in a Thermocycler, and that Thermocycler's lid isn't
        currently open according the engine's thermocycler state as well as
        the hardware API (for non-virtual modules), raises ThermocyclerNotOpenError.
        If it is a virtual module, checks only for thermocycler lid state in engine.

        Otherwise, no-ops.

        Warning:
            Various limitations with our hardware API and Thermocycler firmware mean
            this method can't detect every case where the Thermocycler lid is non-open.

            1. While the lid is in transit, the Thermocycler doesn't respond to status
               polls.
            2. The Thermocycler doesn't report when the user presses its physical
               lid open button; we have to wait for the next poll to find out, which
               can be tens of seconds because of (1).
            3. Nothing protects the Thermocycler hardware controller from being accessed
               concurrently by multiple tasks.
               And updating the Thermocycler state from one task doesn't guarantee that
               that update will be immediately visible from a different task.
               So, for example, if a legacy module control HTTP endpoint starts closing
               the Thermocycler, and then a Protocol Engine task quickly polls the
               Thermocycler through this method, this method may see the lid as open
               even though it's in transit.
        """
        module_id = self._get_parent_module_id(labware_id=labware_id)

        if module_id is None:
            return  # Labware not on a module.
        try:
            tc_substate = self._state_store.modules.get_thermocycler_module_substate(
                module_id=module_id
            )
        except WrongModuleTypeError:
            return  # Labware on a module, but not a Thermocycler.

        if not tc_substate.is_lid_open:
            raise ThermocyclerNotOpenError(
                "Thermocycler must be open when moving to labware inside it."
            )

        # There is a chance that the engine might not have the latest lid status;
        # do a hardware state check just to be sure that the lid is truly open.
        if not self._state_store.config.use_virtual_modules:
            try:
                hw_tc_lid_status = await self._get_hardware_thermocycler_lid_status(
                    module_id=module_id
                )
            except self._HardwareThermocyclerMissingError as e:
                raise ThermocyclerNotOpenError(
                    "Thermocycler must be open when moving to labware inside it,"
                    " but can't confirm Thermocycler's current status."
                ) from e

            if hw_tc_lid_status != ThermocyclerLidStatus.OPEN:
                raise ThermocyclerNotOpenError(
                    f"Thermocycler must be open when moving to labware inside it,"
                    f' but Thermocycler is currently "{hw_tc_lid_status}".'
                )

    async def _get_hardware_thermocycler_lid_status(
        self,
        module_id: str,
    ) -> ThermocyclerLidStatus:
        """Get lid status of the hardware Thermocycler corresponding with the module ID.

        Returns:
            Lid status of the requested attached thermocycler.

        Raises:
            _HardwareThermocyclerMissingError: If we can't find that Thermocycler in
                the hardware API, so we can't fetch its current lid status.
                It's unclear if this can happen in practice...
                maybe if the module disconnects between when it was loaded into
                Protocol Engine and when this function is called?
        """
        thermocycler_serial = self._state_store.modules.get_serial_number(
            module_id=module_id
        )
        thermocycler = await self._find_thermocycler_by_serial(
            serial_number=thermocycler_serial
        )
        if thermocycler is None:
            raise self._HardwareThermocyclerMissingError(
                f"No Thermocycler found" f' with serial number "{thermocycler_serial}".'
            )

        lid_status = thermocycler.lid_status
        # An attached thermocycler should always have lid status unless it's in error
        # or it was just connected and hasn't been polled for status yet.
        assert lid_status is not None, (
            "Did not receive a valid lid status from thermocycler. "
            "Cannot verify safe pipette movement"
        )
        return lid_status

    def _get_parent_module_id(self, labware_id: str) -> Optional[str]:
        labware_location = self._state_store.labware.get_location(labware_id=labware_id)
        if isinstance(labware_location, ModuleLocation):
            return labware_location.moduleId
        else:
            return None

    async def _find_thermocycler_by_serial(
        self, serial_number: str
    ) -> Optional[HardwareThermocycler]:
        """Find the hardware Thermocycler with the given serial number.

        Returns:
            The matching hardware Thermocycler, or None if none was found.
        """
        for module in self._hardware_api.attached_modules:
            # Different module types have different keys under .device_info.
            # Thermocyclers should always have .device_info["serial"].
            if (
                isinstance(module, HardwareThermocycler)
                and module.device_info["serial"] == serial_number
            ):
                return module
        return None

    class _HardwareThermocyclerMissingError(Exception):
        pass
