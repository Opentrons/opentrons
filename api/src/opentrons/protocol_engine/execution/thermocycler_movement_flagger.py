"""Helpers for flagging unsafe movements to a Thermocycler Module."""


from typing import List, Optional

from opentrons.hardware_control.modules.types import (
    # Renamed to avoid conflicting with ..types.ModuleModel.
    ModuleType as OpentronsModuleType,
    ThermocyclerModuleModel as OpentronsThermocyclerModuleModel,
)
from opentrons.drivers.types import ThermocyclerLidStatus
from opentrons.hardware_control import API as HardwareAPI
from opentrons.hardware_control.modules import (
    AbstractModule as AbstractHardwareModule,
    Thermocycler as HardwareThermocycler,
)

from ..types import ModuleLocation, ModuleModel as PEModuleModel
from ..state import StateStore
from ..errors import ThermocyclerNotOpenError


class ThermocyclerMovementFlagger:
    """A helper for flagging unsafe movements to a Thermocycler Module.

    This is only intended for use by MovementHandler.
    It's a separate class for independent testability.
    """

    def __init__(self, state_store: StateStore, hardware_api: HardwareAPI) -> None:
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
        """Raise if the given labware is inside a Thermocycler whose lid isn't open.

        Otherwise, no-op.

        Raises:
            ThermocyclerNotOpenError
        """
        try:
            thermocycler = await self._find_containing_thermocycler(
                labware_id=labware_id
            )

        except self._HardwareThermocyclerMissingError as e:
            raise ThermocyclerNotOpenError(
                "Thermocycler must be open when moving to labware inside it,"
                " but can't confirm Thermocycler's current status."
            ) from e

        if thermocycler is not None:
            lid_status = thermocycler.lid_status
            if lid_status != ThermocyclerLidStatus.OPEN:
                raise ThermocyclerNotOpenError(
                    f"Thermocycler must be open when moving to labware inside it,"
                    f' but Thermocycler is currently "{lid_status}".'
                )

    async def _find_containing_thermocycler(
        self,
        labware_id: str,
    ) -> Optional[HardwareThermocycler]:
        """Find the hardware Thermocycler containing the given labware.

        Returns:
            If the labware was loaded into a Thermocycler,
            the interface to control that Thermocycler's hardware.
            Otherwise, None.

        Raises:
            _HardwareThermocyclerMissingError: If the labware was loaded into a
                Thermocycler, but we can't find that Thermocycler in the hardware API,
                so we can't fetch its current lid status.
                It's unclear if this can happen in practice...
                maybe if the module disconnects between when it was loaded into
                Protocol Engine and when this function is called?
        """
        module_id = self._get_parent_module_id(labware_id=labware_id)
        if module_id is None:
            return None  # Labware not on a module.

        module_model = self._state_store.modules.get_model(module_id=module_id)
        if module_model != PEModuleModel.THERMOCYCLER_MODULE_V1:
            return None  # Labware on a module, but not a Thermocycler.

        thermocycler_serial = self._state_store.modules.get_serial(module_id=module_id)
        thermocycler = await self._find_thermocycler_by_serial(
            serial_number=thermocycler_serial
        )
        if thermocycler is None:
            raise self._HardwareThermocyclerMissingError(
                f"No Thermocycler found" f' with serial number "{thermocycler_serial}".'
            )

        return thermocycler

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
        available_modules, simulating_module = await self._hardware_api.find_modules(
            by_model=OpentronsThermocyclerModuleModel.THERMOCYCLER_V1,
            # Hard-coding instead of using
            # opentrons.protocols.geometry.module_geometry.resolve_module_type(),
            # to avoid parsing a JSON definition every time a protocol moves to
            # something inside a Thermocycler.
            resolved_type=OpentronsModuleType.THERMOCYCLER,
        )

        modules_to_check: List[AbstractHardwareModule] = (
            available_modules if simulating_module is None else [simulating_module]
        )

        for module in modules_to_check:
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
