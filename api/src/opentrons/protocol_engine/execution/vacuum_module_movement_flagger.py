"""Helpers for flagging unsafe movements to a Vacuum Module."""

from typing import Optional

from ..errors import WrongModuleTypeError
from ..state.state import StateStore
from ..types import LabwareLocation, ModuleLocation, ModuleModel
from .equipment import EquipmentHandler
from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.modules.vacuum_module import VacuumModule
from opentrons.protocol_engine.errors.exceptions import (
    VacuumModuleStillUnderVacuumError,
    VacuumModuleUnderVacuumError,
)


class VacuumModuleMovementFlagger:
    """A helper for flagging unsafe movements to a VacuumModule Module.

    This is only intended for use by movement handlers.
    It's a separate class for independent testability.
    """

    def __init__(
        self,
        state_store: StateStore,
        hardware_api: HardwareControlAPI,
        equipment: EquipmentHandler,
    ) -> None:
        """Initialize the VacuumModuleMovementFlagger.

        Args:
            state_store: The Protocol Engine state store interface. Used to figure out
                         which VacuumModule a labware is in, if any.
            hardware_api: The underlying hardware interface. Used to query
                          VacuumModules' current vacuum states.
            equipment: The protocol engine interface to move a present vacuum_module to an
                            operable state if need be.
        """
        self._state_store = state_store
        self._hardware_api = hardware_api
        self._equipment = equipment

    async def ensure_vacuum_module_is_idle(
        self, labware_parent: LabwareLocation
    ) -> None:
        """Flag unsafe movements to a VacuumModule.

        If the given labware is in a VacuumModule, and that VacuumModule's pump is
        currently engaged according to the engine's vacuum module state, raises
        VacuumModuleUnderVacuumError.

        If the pump is not engaged but the hardware reports the module is still under
        vacuum, raises VacuumModuleStillUnderVacuumError. That error is recoverable at
        runtime by waiting for pressure to equalize.

        Otherwise, no-ops.
        """
        if isinstance(labware_parent, ModuleLocation):
            module_id = labware_parent.moduleId
        else:
            return  # Labware not on a module.
        try:
            vm_substate = self._state_store.modules.get_vacuum_module_substate(
                module_id=module_id
            )
        except WrongModuleTypeError:
            return  # Labware on a module, but not a VacuumModule.

        if vm_substate.pump_engaged:
            raise VacuumModuleUnderVacuumError(
                f"Vacuum Module {vm_substate.module_id} must not have its pump engaged "
                "when moving labware to or from it."
            )

        if not self._state_store.config.use_virtual_modules:
            vacuum_module = await self._get_hardware_vacuum_module(module_id=module_id)
            if vacuum_module.under_vacuum:
                raise VacuumModuleStillUnderVacuumError(
                    module_id=vm_substate.module_id,
                    current_gauge_pressure_mbar=vacuum_module.current_gauge_pressure_mbar,
                )

    async def _get_hardware_vacuum_module(
        self,
        module_id: str,
    ) -> VacuumModule:
        """Get the hardware VacuumModule corresponding with the module ID.

        Raises:
            _HardwareVacuumModuleMissingError: If we can't find that VacuumModule in
                the hardware API.
        """
        vacuum_module_serial = self._state_store.modules.get_serial_number(
            module_id=module_id
        )
        vacuum_module = await self._find_vacuum_module_by_serial(
            serial_number=vacuum_module_serial
        )
        if vacuum_module is None:
            raise self._HardwareVacuumModuleMissingError(
                f'No VacuumModule found with serial number "{vacuum_module_serial}".'
            )

        return vacuum_module

    async def _find_vacuum_module_by_serial(
        self, serial_number: str
    ) -> Optional[VacuumModule]:
        """Find the hardware VacuumModule with the given serial number."""
        for module in self._hardware_api.attached_modules:
            if (
                module.model() == ModuleModel.VACUUM_MODULE_V1
                and module.device_info["serial"] == serial_number
            ):
                return module  # type: ignore[return-value]
        return None

    class _HardwareVacuumModuleMissingError(Exception):
        pass
