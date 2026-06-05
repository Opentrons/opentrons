"""Command models to operate the vacuum pump with respect to motor pulsewidth."""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from pydantic import BaseModel, Field
from pydantic.json_schema import SkipJsonSchema
from typing_extensions import Literal, Type

from ...errors.error_occurrence import ErrorOccurrence
from ...state import update_types
from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData

if TYPE_CHECKING:
    from opentrons.protocol_engine.execution import EquipmentHandler, MovementHandler
    from opentrons.protocol_engine.state.state import StateView

StartSetVacuumPowerCommandType = Literal["vacuumModule/startSetVacuumPower"]


class StartSetVacuumPowerParams(BaseModel):
    """Input parameters to start the vacuum pump."""

    moduleId: str = Field(..., description="Unique ID of the vacuum module.")
    percentPower: int = Field(
        ...,
        description="Desired duty cycle of the vacuum pump as a percentage between 1 and 100%.",
    )
    duration: int | SkipJsonSchema[None] = Field(
        None,
        description="Duration in sec. to hold target power for after it is reached.",
    )
    rate: float | SkipJsonSchema[None] = Field(
        None, description="Target rate of power change in mbar/sec"
    )
    timeout: int | SkipJsonSchema[None] = Field(
        None,
        description="Specify timeframe in seconds that target power must be reached in before a timeout error occurs.",
    )
    ventAfter: bool = Field(
        True,
        description="Whether the system should open the vent after the target power is held for the duration.",
    )


class StartSetVacuumPowerResult(BaseModel):
    """Result data from starting the vacuum pump."""


class StartSetVacuumPowerImpl(
    AbstractCommandImpl[
        StartSetVacuumPowerParams, SuccessData[StartSetVacuumPowerResult]
    ]
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
        self, params: StartSetVacuumPowerParams
    ) -> SuccessData[StartSetVacuumPowerResult]:
        """Start the vacuum pump."""
        state_update = update_types.StateUpdate()
        vm_state = self._state_view.modules.get_vacuum_module_substate(params.moduleId)
        if params.percentPower < 0 or params.percentPower > 100:
            raise ValueError(
                f"pump power {params.percentPower} invalid must be between 1 and 100%"
            )
        vm_hardware = self._equipment.get_module_hardware_api(vm_state.module_id)
        if vm_hardware is not None:
            await vm_hardware.set_pump_state(
                start_pump=True,
                duty_cycle=params.percentPower,
                duration_s=params.duration,
                timeout_s=params.timeout,
                rate=params.rate,
                vent_after=params.ventAfter,
            )

        return SuccessData(
            public=StartSetVacuumPowerResult(), state_update=state_update
        )


class StartSetVacuumPower(
    BaseCommand[StartSetVacuumPowerParams, StartSetVacuumPowerResult, ErrorOccurrence]
):
    """A command to set the vacuum pump power."""

    commandType: StartSetVacuumPowerCommandType = "vacuumModule/startSetVacuumPower"
    params: StartSetVacuumPowerParams
    result: Optional[StartSetVacuumPowerResult] = None

    _ImplementationCls: Type[StartSetVacuumPowerImpl] = StartSetVacuumPowerImpl


class StartSetVacuumPowerCreate(BaseCommandCreate[StartSetVacuumPowerParams]):
    """A request to set the vacuum pump power."""

    commandType: StartSetVacuumPowerCommandType = "vacuumModule/startSetVacuumPower"
    params: StartSetVacuumPowerParams

    _CommandCls: Type[StartSetVacuumPower] = StartSetVacuumPower
