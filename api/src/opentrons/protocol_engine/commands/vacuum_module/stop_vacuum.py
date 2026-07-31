"""Command models to stop the vacuum pump."""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from pydantic import BaseModel, Field
from typing_extensions import Literal, Type

from ...errors.error_occurrence import ErrorOccurrence
from ...state import update_types
from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData

if TYPE_CHECKING:
    from opentrons.protocol_engine.execution import EquipmentHandler, MovementHandler
    from opentrons.protocol_engine.state.state import StateView

StopVacuumCommandType = Literal["vacuumModule/stopVacuum"]


class StopVacuumParams(BaseModel):
    """Input parameters to stop the vacuum pump."""

    moduleId: str = Field(..., description="Unique ID of the vacuum module.")


class StopVacuumResult(BaseModel):
    """Result data from stopping the vacuum pump."""


class StopVacuumImpl(
    AbstractCommandImpl[StopVacuumParams, SuccessData[StopVacuumResult]]
):
    """Execution implementation of a stop vacuum pump command."""

    def __init__(
        self,
        state_view: StateView,
        equipment: EquipmentHandler,
        movement: MovementHandler,
        **unused_dependencies: object,
    ) -> None:
        self._state_view = state_view
        self._equipment = equipment
        self._movement = movement

    async def execute(self, params: StopVacuumParams) -> SuccessData[StopVacuumResult]:
        """Stop the vacuum pump."""
        state_update = update_types.StateUpdate()
        vm_state = self._state_view.modules.get_vacuum_module_substate(params.moduleId)

        vm_hardware = self._equipment.get_module_hardware_api(vm_state.module_id)
        if vm_hardware is not None:
            await vm_hardware.stop_vacuum()

        state_update.update_vacuum_module_pump_engaged(params.moduleId, False)
        return SuccessData(public=StopVacuumResult(), state_update=state_update)


class StopVacuum(BaseCommand[StopVacuumParams, StopVacuumResult, ErrorOccurrence]):
    """A command to stop the vacuum pump."""

    commandType: StopVacuumCommandType = "vacuumModule/stopVacuum"
    params: StopVacuumParams
    result: Optional[StopVacuumResult] = None

    _ImplementationCls: Type[StopVacuumImpl] = StopVacuumImpl


class StopVacuumCreate(BaseCommandCreate[StopVacuumParams]):
    """A request to stop the vacuum pump."""

    commandType: StopVacuumCommandType = "vacuumModule/stopVacuum"
    params: StopVacuumParams

    _CommandCls: Type[StopVacuum] = StopVacuum
