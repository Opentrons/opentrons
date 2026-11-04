"""Command models to close the vent."""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from pydantic import BaseModel, Field
from typing_extensions import Literal, Type

from ...errors.error_occurrence import ErrorOccurrence
from ...state import update_types
from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from opentrons.drivers.vacuum_module.types import VentState

if TYPE_CHECKING:
    from opentrons.protocol_engine.execution import EquipmentHandler, MovementHandler
    from opentrons.protocol_engine.state.state import StateView

CloseVentCommandType = Literal["vacuumModule/closeVent"]


class CloseVentParams(BaseModel):
    """Input parameters to close the vent."""

    moduleId: str = Field(..., description="Unique ID of the vacuum module.")


class CloseVentResult(BaseModel):
    """Result data from closeing the vent."""


class CloseVentImpl(AbstractCommandImpl[CloseVentParams, SuccessData[CloseVentResult]]):
    """Execution implementation of a close vent command."""

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

    async def execute(self, params: CloseVentParams) -> SuccessData[CloseVentResult]:
        """Close the vent."""
        state_update = update_types.StateUpdate()
        vm_state = self._state_view.modules.get_vacuum_module_substate(params.moduleId)
        vm_hardware = self._equipment.get_module_hardware_api(vm_state.module_id)
        if vm_hardware is not None:
            await vm_hardware.set_vent_state(vent_state=VentState.CLOSED)

        return SuccessData(public=CloseVentResult(), state_update=state_update)


class CloseVent(BaseCommand[CloseVentParams, CloseVentResult, ErrorOccurrence]):
    """A command to close the vent."""

    commandType: CloseVentCommandType = "vacuumModule/closeVent"
    params: CloseVentParams
    result: Optional[CloseVentResult] = None

    _ImplementationCls: Type[CloseVentImpl] = CloseVentImpl


class CloseVentCreate(BaseCommandCreate[CloseVentParams]):
    """A request to close the vent."""

    commandType: CloseVentCommandType = "vacuumModule/closeVent"
    params: CloseVentParams

    _CommandCls: Type[CloseVent] = CloseVent
