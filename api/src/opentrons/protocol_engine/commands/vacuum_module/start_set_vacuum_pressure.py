"""Command models to operate the vacuum pump with respect to pressure."""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from pydantic import BaseModel, Field
from pydantic.json_schema import SkipJsonSchema
from typing_extensions import Literal, Type

from ...errors.error_occurrence import ErrorOccurrence
from ...state import update_types
from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from opentrons.drivers.vacuum_module.driver import (
    MAX_GAUGE_PRESSURE_MBAR,
    MIN_GAUGE_PRESSURE_MBAR,
)

if TYPE_CHECKING:
    from opentrons.protocol_engine.execution import (
        EquipmentHandler,
        MovementHandler,
        TaskHandler,
    )
    from opentrons.protocol_engine.state.state import StateView

StartSetVacuumPressureCommandType = Literal["vacuumModule/startSetVacuumPressure"]


class StartSetVacuumPressureParams(BaseModel):
    """Input parameters to set the internal vacuum pressure."""

    moduleId: str = Field(..., description="Unique ID of the vacuum module.")
    gaugePressure: float = Field(..., description="Target gauge pressure in mBar.")
    duration: int | SkipJsonSchema[None] = Field(
        None,
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
    taskId: str | None = Field(None, description="The id of the task")


class StartSetVacuumPressureResult(BaseModel):
    """Result data from starting the vacuum pump."""

    taskId: str = Field(..., description="The id of the task")


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
        task_handler: TaskHandler,
        **unused_dependencies: object,
    ) -> None:
        self._state_view = state_view
        self._equipment = equipment
        self._movement = movement
        self._task_handler = task_handler

    async def execute(
        self, params: StartSetVacuumPressureParams
    ) -> SuccessData[StartSetVacuumPressureResult]:
        """Start the vacuum pump."""
        state_update = update_types.StateUpdate()
        vm_state = self._state_view.modules.get_vacuum_module_substate(params.moduleId)
        if (
            params.gaugePressure < MAX_GAUGE_PRESSURE_MBAR
            or params.gaugePressure > MIN_GAUGE_PRESSURE_MBAR
        ):
            raise ValueError(
                f"Gauge pressure {params.gaugePressure} invalid must be between {MAX_GAUGE_PRESSURE_MBAR} and {MIN_GAUGE_PRESSURE_MBAR} mbar."
            )

        vm_hardware = self._equipment.get_module_hardware_api(vm_state.module_id)

        async def start_set_vacuum_pressure(task_handler: TaskHandler) -> None:
            if vm_hardware is not None:
                async with task_handler.synchronize_cancel_latest(vm_state.module_id):
                    await vm_hardware.set_vacuum_state(
                        enable_vacuum=True,
                        gauge_pressure_mbar=params.gaugePressure,
                        duration_s=params.duration,
                        rate=params.rate if params.rate else None,
                        timeout_s=params.timeout if params.timeout else None,
                        vent_after=params.ventAfter,
                    )

                    if params.duration is not None:
                        await vm_hardware.wait_for_command_duration()
                    else:
                        await vm_hardware.wait_for_target()

        task = await self._task_handler.create_task(
            task_function=start_set_vacuum_pressure, id=params.taskId
        )

        return SuccessData(
            public=StartSetVacuumPressureResult(taskId=task.id),
            state_update=state_update,
        )


class StartSetVacuumPressure(
    BaseCommand[
        StartSetVacuumPressureParams, StartSetVacuumPressureResult, ErrorOccurrence
    ]
):
    """A command to start the vacuum pump."""

    commandType: StartSetVacuumPressureCommandType = (
        "vacuumModule/startSetVacuumPressure"
    )
    params: StartSetVacuumPressureParams
    result: Optional[StartSetVacuumPressureResult] = None

    _ImplementationCls: Type[StartSetVacuumPressureImpl] = StartSetVacuumPressureImpl


class StartSetVacuumPressureCreate(BaseCommandCreate[StartSetVacuumPressureParams]):
    """A request to start the vacuum pump."""

    commandType: StartSetVacuumPressureCommandType = (
        "vacuumModule/startSetVacuumPressure"
    )
    params: StartSetVacuumPressureParams

    _CommandCls: Type[StartSetVacuumPressure] = StartSetVacuumPressure
