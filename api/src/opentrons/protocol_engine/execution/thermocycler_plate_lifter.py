"""Thermocycler plate lift handling for labware movement using gripper."""
from __future__ import annotations

from typing import TYPE_CHECKING
from opentrons.protocol_engine.types import LabwareLocation, ModuleLocation, ModuleModel
from opentrons.protocol_engine.state import StateStore, ThermocyclerModuleId

if TYPE_CHECKING:
    from opentrons.protocol_engine.execution import EquipmentHandler, MovementHandler


class ThermocyclerPlateLifter:
    """Implementation logic for TC Gen2 plate lifting."""

    _state_store: StateStore

    def __init__(
        self,
        state_store: StateStore,
        equipment: EquipmentHandler,
        movement: MovementHandler,
    ) -> None:
        """Initialize a ThermocyclerPlateLifter instance."""
        self._state_store = state_store
        self._equipment = equipment
        self._movement = movement

    async def lift_plate_for_labware_movement(
        self,
        labware_location: LabwareLocation,
    ) -> None:
        """Lift plate if moving labware from Thermocycler Gen2.

        If we are moving labware from TC Gen2, then there is a chance that the labware
        will need unsticking so it can be picked up. TC gen1 is neither compatible with
        the gripper/OT3 nor does it have any plate lifting mechanism so we no-op for it.
        """
        if isinstance(labware_location, ModuleLocation):
            module_id = labware_location.moduleId
            if (
                self._state_store.modules.get_connected_model(module_id)
                == ModuleModel.THERMOCYCLER_MODULE_V2
            ):
                # We already verify that TC lid is open before moving labware. So,
                # only assert that that is still true.
                assert self._state_store.modules.get_thermocycler_module_substate(
                    module_id
                ).is_lid_open, (
                    "Thermocycler lid needs to be open before performing a plate lift"
                )

                # TODO (spp, 2023-02-09): replace with a park/fast-home action
                await self._movement.home(axes=None)
                thermocycler_hardware = self._equipment.get_module_hardware_api(
                    ThermocyclerModuleId(labware_location.moduleId)
                )
                if thermocycler_hardware is not None:
                    await thermocycler_hardware.lift_plate()
