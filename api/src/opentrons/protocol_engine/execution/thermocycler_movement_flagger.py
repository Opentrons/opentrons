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
            lid_status = await self._get_parent_thermocycler_lid_status(
                labware_id=labware_id
            )
        except self._HardwareThermocyclerMissingError as e:
            raise ThermocyclerNotOpenError(
                "Thermocycler must be open when moving to labware inside it,"
                " but can't confirm Thermocycler's current status."
            ) from e
        except self._NotInAThermocyclerError:
            pass
        else:
            if lid_status != ThermocyclerLidStatus.OPEN:
                raise ThermocyclerNotOpenError(
                    f"Thermocycler must be open when moving to labware inside it,"
                    f' but Thermocycler is currently "{lid_status}".'
                )

    # todo(mm, 2021-12-01): Return non-Optional when the hardware API no longer has
    # None as a possible lid status and we no longer need to pass that along.
    async def _get_parent_thermocycler_lid_status(
        self,
        labware_id: str,
    ) -> Optional[ThermocyclerLidStatus]:
        """Return the current lid status of the Thermocycler containing the labware.

        Raises:
            _NotInAThermocyclerError: If the labware isn't contained in a Thermocycler.
                We need to raise an exception to signal this instead of returning None
                because None is already a possible Thermocycler lid status.
            _HardwareThermocyclerMissingError: If the labware is in a Thermocycler, but
                we can't find that Thermocycler in the hardware API, so we can't fetch
                its current lid status. It's unclear if this can happen in practice...
                maybe if the module disconnects between when it was loaded into
                Protocol Engine and when this function is called?
        """
        labware_location = self._state_store.labware.get_location(labware_id=labware_id)
        if isinstance(labware_location, ModuleLocation):
            module_id = labware_location.moduleId
            if (
                self._state_store.modules.get_model(module_id=module_id)
                == PEModuleModel.THERMOCYCLER_MODULE_V1
            ):
                thermocycler_serial = self._state_store.modules.get_serial(
                    module_id=module_id
                )

                thermocycler = await self._find_thermocycler_by_serial(
                    serial_number=thermocycler_serial
                )

                if thermocycler is not None:
                    return thermocycler.lid_status
                else:
                    raise self._HardwareThermocyclerMissingError(
                        f"No Thermocycler found"
                        f' with serial number "{thermocycler_serial}".'
                    )
            else:
                # The labware is in a module, but it's not a Thermocycler.
                raise self._NotInAThermocyclerError()
        else:
            # The labware isn't in any module.
            raise self._NotInAThermocyclerError()

    async def _find_thermocycler_by_serial(
        self, serial_number: str
    ) -> Optional[HardwareThermocycler]:
        available_modules, simulating_module = await self._hardware_api.find_modules(
            by_model=OpentronsThermocyclerModuleModel.THERMOCYCLER_V1,
            # Hard-coding instead of using
            # opentrons.protocols.geometry.module_geometry.resolve_module_type(),
            # to avoid parsing a JSON definition every time a protocol moves to
            # something inside a Thermocycler.
            resolved_type=OpentronsModuleType.THERMOCYCLER,
        )

        modules_to_check: List[AbstractHardwareModule] = (
            available_modules
            if simulating_module is None
            else
            # todo(mm, 2021-12-01): It's unclear what it means if available_modules is
            # non-empty AND simulating_module is non-None. Is concatenating them like
            # this correct?
            available_modules + [simulating_module]
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

    class _NotInAThermocyclerError(Exception):
        pass

    class _HardwareThermocyclerMissingError(Exception):
        pass
