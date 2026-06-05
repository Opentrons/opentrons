"""Command models to wait for vacuum pressure."""

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

WaitForTargetCommandType = Literal["vacuumModule/waitForTarget"]


class WaitForTargetParams(BaseModel):
    """Input parameters to wait for pressure."""

    moduleId: str = Field(..., description="Unique ID of the vacuum module.")


class WaitForTargetResult(BaseModel):
    """Result data from waiting for pressure."""


class WaitForTargetImpl(
    AbstractCommandImpl[WaitForTargetParams, SuccessData[WaitForTargetResult]]
):
    """Execution implementation of a wait for pressure command."""

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

    async def execute(
        self, params: WaitForTargetParams
    ) -> SuccessData[WaitForTargetResult]:
        """Wait for vacuum pressure."""
        state_update = update_types.StateUpdate()
        vm_state = self._state_view.modules.get_vacuum_module_substate(params.moduleId)

        vm_hardware = self._equipment.get_module_hardware_api(vm_state.module_id)
        if vm_hardware is not None:
            await vm_hardware.wait_for_target()

        return SuccessData(public=WaitForTargetResult(), state_update=state_update)


class WaitForTarget(
    BaseCommand[WaitForTargetParams, WaitForTargetResult, ErrorOccurrence]
):
    """A command to stop the vacuum pump."""

    commandType: WaitForTargetCommandType = "vacuumModule/waitForTarget"
    params: WaitForTargetParams
    result: Optional[WaitForTargetResult] = None

    _ImplementationCls: Type[WaitForTargetImpl] = WaitForTargetImpl


class WaitForTargetCreate(BaseCommandCreate[WaitForTargetParams]):
    """A request to stop the vacuum pump."""

    commandType: WaitForTargetCommandType = "vacuumModule/waitForTarget"
    params: WaitForTargetParams

    _CommandCls: Type[WaitForTarget] = WaitForTarget
