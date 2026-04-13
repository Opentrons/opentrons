"""Command models to operate the vacuum pump with respect to motor pulsewidth."""

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

StartSetVacuumPumpCommandType = Literal["vacuum_module/StartSetVacuumPump"]


class StartSetVacuumPumpParams(BaseModel):
    """Input parameters to start the vacuum pump."""

    moduleId: str = Field(..., description="Unique ID of the vacuum module.")
    percentPower: int = Field(
        ...,
        description="Desired duty cycle of the vacuum pump as a percentage.",
    )


class StartSetVacuumPumpResult(BaseModel):
    """Result data from starting the vacuum pump."""


class StartSetVacuumPumpImpl(
    AbstractCommandImpl[StartSetVacuumPumpParams, SuccessData[StartSetVacuumPumpResult]]
):
    """Execution implementation of a start set vacuum pump command."""

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
        self, params: StartSetVacuumPumpParams
    ) -> SuccessData[StartSetVacuumPumpResult]:
        """Start the vacuum pump."""
        state_update = update_types.StateUpdate()
        vm_state = self._state_view.modules.get_vacuum_module_substate(params.moduleId)

        vm_hardware = self._equipment.get_module_hardware_api(vm_state.module_id)
        if vm_hardware is not None:
            await vm_hardware.set_pump_state(
                start_pump=True,
                duty_cycle=params.percentPower,
            )

        return SuccessData(public=StartSetVacuumPumpResult(), state_update=state_update)


class StartSetVacuumPump(
    BaseCommand[StartSetVacuumPumpParams, StartSetVacuumPumpResult, ErrorOccurrence]
):
    """A command to start the vacuum pump."""

    commandType: StartSetVacuumPumpCommandType = "vacuum_module/StartSetVacuumPump"
    params: StartSetVacuumPumpParams
    result: Optional[StartSetVacuumPumpResult] = None

    _ImplementationCls: Type[StartSetVacuumPumpImpl] = StartSetVacuumPumpImpl


class StartSetVacuumPumpCreate(BaseCommandCreate[StartSetVacuumPumpParams]):
    """A request to start the vacuum pump."""

    commandType: StartSetVacuumPumpCommandType = "vacuum_module/StartSetVacuumPump"
    params: StartSetVacuumPumpParams

    _CommandCls: Type[StartSetVacuumPump] = StartSetVacuumPump
