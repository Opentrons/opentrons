"""Helpers for flagging unsafe movements to a Thermocycler Module."""


from typing import Optional

from opentrons.hardware_control import API as HardwareAPI
from opentrons.hardware_control.modules import (
    Thermocycler as HardwareThermocycler,
)
from opentrons.drivers.types import ThermocyclerLidStatus

from ..types import ModuleLocation, ModuleModel
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

    def raise_if_labware_in_non_open_thermocycler(self, labware_id: str) -> None:
        """Raise if the given labware is inside a Thermocycler whose lid isn't open.

        Otherwise, no-op.

        Raises:
            ThermocyclerNotOpenError
        """
        try:
            lid_status = self._get_parent_thermocycler_lid_status(labware_id=labware_id)
        except self._NotInAThermocyclerError:
            pass
        else:
            if lid_status != ThermocyclerLidStatus.OPEN:
                raise ThermocyclerNotOpenError(
                    f"Thermocycler must be open when moving to labware inside it,"
                    f' but Thermocycler is currently "{lid_status}".'
                )

    def _get_parent_thermocycler_lid_status(
        self,
        labware_id: str,
    ) -> Optional[ThermocyclerLidStatus]:
        """Return the current lid status of the Thermocycler containing the labware.

        Raises:
            NotInAThermocyclerError: If the labware isn't contained in a Thermocycler.
                                     We need to raise an exception to signal this
                                     instead of returning None because None is already
                                     a possible Thermocycler lid status.
        """
        labware_location = self._state_store.labware.get_location(labware_id=labware_id)
        if isinstance(labware_location, ModuleLocation):
            module_id = labware_location.moduleId
            if (
                self._state_store.modules.get_model(module_id=module_id)
                == ModuleModel.THERMOCYCLER_MODULE_V1
            ):
                thermocycler_serial = self._state_store.modules.get_serial(
                    module_id=module_id
                )
                thermocycler = self._find_thermocycler_by_serial(
                    serial_number=thermocycler_serial
                )
                return thermocycler.lid_status
            else:
                # The labware is in a module, but it's not a Thermocycler.
                raise self._NotInAThermocyclerError()
        else:
            # The labware isn't in any module.
            raise self._NotInAThermocyclerError()

    def _find_thermocycler_by_serial(self, serial_number: str) -> HardwareThermocycler:
        for attached_module in self._hardware_api.attached_modules:
            # Different module types have different keys under .device_info.
            # Thermocyclers should always have .device_info["serial"].
            if (
                isinstance(attached_module, HardwareThermocycler)
                and attached_module.device_info["serial"] == serial_number
            ):
                return attached_module

        # FIX BEFORE MERGE:
        # Better error. This can happen if the module was disconnected
        # between load and now, I think.
        assert False

    class _NotInAThermocyclerError(Exception):
        pass
