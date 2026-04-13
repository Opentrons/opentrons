"""Command models to start the vacuum pump."""

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

StartSetVacuumPressureCommandType = Literal["vacuum_module/StartSetVacuumPressure"]


class StartSetVacuumPressureParams(BaseModel):
    """Input parameters to start the vacuum pump."""

    moduleId: str = Field(..., description="Unique ID of the vacuum module.")
    gaugePressure: float = Field(..., description="Target gauge pressure in mBar.")
    duration: int = Field(
        ...,
        description="Duration in sec. to hold target pressure for after it is reached.",
    )
    rate: float | SkipJsonSchema[None] = Field(
        None, description="Target rate of pressure change in mbar/sec"
    )
    timeout: int | SkipJsonSchema[None] = Field(
        None,
        description="Specify timeframe in seconds that pressure must be reached in before a timeout error occurs.",
    )
    ventAfter: bool = Field(
        True,
        description="Whether the system should open the vent after the target pressure is held for the duration.",
    )


class StartSetVacuumPressureResult(BaseModel):
    """Result data from starting the vacuum pump."""


class StartSetVacuumPressureImpl(
    AbstractCommandImpl[
        StartSetVacuumPressureParams, SuccessData[StartSetVacuumPressureResult]
    ]
):
    """Execution implementation of a start set vacuum command."""

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
        self, params: StartSetVacuumPressureParams
    ) -> SuccessData[StartSetVacuumPressureResult]:
        """Start the vacuum pump."""
        state_update = update_types.StateUpdate()
        vm_state = self._state_view.modules.get_vacuum_module_substate(params.moduleId)

        vm_hardware = self._equipment.get_module_hardware_api(vm_state.module_id)
        if vm_hardware is not None:
            await vm_hardware.set_vacuum_state(
                enable_vacuum=True,
                gauge_pressure_mbar=params.gaugePressure,
                duration_s=params.duration,
                rate=params.rate if params.rate else None,
                timeout_s=params.timeout if params.timeout else None,
                vent_after=params.ventAfter,
            )

        return SuccessData(
            public=StartSetVacuumPressureResult(), state_update=state_update
        )


class StartSetVacuumPressure(
    BaseCommand[
        StartSetVacuumPressureParams, StartSetVacuumPressureResult, ErrorOccurrence
    ]
):
    """A command to start the vacuum pump."""

    commandType: StartSetVacuumPressureCommandType = (
        "vacuum_module/StartSetVacuumPressure"
    )
    params: StartSetVacuumPressureParams
    result: Optional[StartSetVacuumPressureResult] = None

    _ImplementationCls: Type[StartSetVacuumPressureImpl] = StartSetVacuumPressureImpl


class StartSetVacuumPressureCreate(BaseCommandCreate[StartSetVacuumPressureParams]):
    """A request to start the vacuum pump."""

    commandType: StartSetVacuumPressureCommandType = (
        "vacuum_module/StartSetVacuumPressure"
    )
    params: StartSetVacuumPressureParams

    _CommandCls: Type[StartSetVacuumPressure] = StartSetVacuumPressure
