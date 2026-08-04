"""Command models to operate the vacuum pump with respect to pressure."""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional, Union

from pydantic import BaseModel, Field
from pydantic.json_schema import SkipJsonSchema
from typing_extensions import Literal, Type

from ...errors.error_occurrence import ErrorOccurrence
from ...state import update_types
from ..command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
    SuccessData,
)
from opentrons.drivers.vacuum_module.driver import (
    MAX_GAUGE_PRESSURE_MBAR,
    MAX_VAC_DURATION_S,
    MIN_GAUGE_PRESSURE_MBAR,
)
from opentrons.protocol_engine.commands.vacuum_module.common import (
    will_equalize_after_operation,
)
from opentrons.protocol_engine.resources import ModelUtils

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
    equalizeTimeout: int | SkipJsonSchema[None] = Field(
        None,
        description=(
            "Time in seconds to wait for pressure equalization after opening the vent. "
            "Does not wait if None."
        ),
    )
    taskId: str | None = Field(None, description="The id of the task")


class StartSetVacuumPressureResult(BaseModel):
    """Result data from starting the vacuum pump."""

    taskId: str = Field(..., description="The id of the task")


_ExecuteReturn = Union[SuccessData[StartSetVacuumPressureResult],]


class StartSetVacuumPressureImpl(
    AbstractCommandImpl[StartSetVacuumPressureParams, _ExecuteReturn]
):
    """Execution implementation of a start set vacuum command."""

    def __init__(
        self,
        state_view: StateView,
        equipment: EquipmentHandler,
        movement: MovementHandler,
        task_handler: TaskHandler,
        model_utils: ModelUtils,
        **unused_dependencies: object,
    ) -> None:
        self._state_view = state_view
        self._equipment = equipment
        self._movement = movement
        self._task_handler = task_handler
        self._model_utils = model_utils

    async def execute(
        self, params: StartSetVacuumPressureParams
    ) -> SuccessData[StartSetVacuumPressureResult]:
        """Start the vacuum pump."""
        clears_residual = will_equalize_after_operation(
            vent_after=params.ventAfter,
            equalize_timeout=params.equalizeTimeout,
            duration=params.duration,
        )

        state_update = update_types.StateUpdate()
        state_update.update_vacuum_module_pump_engaged(
            params.moduleId, params.duration is None
        )
        state_update.update_vacuum_module_residual_vacuum(
            params.moduleId, not clears_residual
        )
        running_command_id = self._state_view.commands.get_running_command_id()
        if running_command_id is not None:
            state_update.record_module_background_command(
                params.moduleId, running_command_id
            )

        if (
            params.gaugePressure < MAX_GAUGE_PRESSURE_MBAR
            or params.gaugePressure > MIN_GAUGE_PRESSURE_MBAR
        ):
            raise ValueError(
                f"Gauge pressure {params.gaugePressure} invalid must be between {MAX_GAUGE_PRESSURE_MBAR} and {MIN_GAUGE_PRESSURE_MBAR} mbar."
            )
        for p in [params.duration, params.timeout, params.equalizeTimeout]:
            if p is not None and (p < 0 or p > MAX_VAC_DURATION_S):
                raise ValueError(
                    f"Duration or timeout {p} is invalid, must be between 0-{MAX_VAC_DURATION_S} seconds."
                )

        vm_state = self._state_view.modules.get_vacuum_module_substate(params.moduleId)
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

                    # Wait until we equalize pressure if vent is open and there
                    # is a set duration until the pump shuts down.
                    if (
                        params.equalizeTimeout is not None
                        and params.duration is not None
                        and params.ventAfter
                    ):
                        await vm_hardware.wait_for_pressure_equalization(
                            params.equalizeTimeout
                        )

                    state_update.update_vacuum_module_pump_engaged(
                        params.moduleId, vm_hardware.pump_running
                    )

        task = await self._task_handler.create_task(
            task_function=start_set_vacuum_pressure, id=params.taskId
        )

        return SuccessData(
            public=StartSetVacuumPressureResult(taskId=task.id),
            state_update=state_update,
        )


class StartSetVacuumPressure(
    BaseCommand[
        StartSetVacuumPressureParams,
        StartSetVacuumPressureResult,
        ErrorOccurrence,
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
