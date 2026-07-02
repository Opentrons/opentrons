"""Command models to operate the vacuum pump with respect to motor pulsewidth."""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional, Union

from pydantic import BaseModel, Field
from pydantic.json_schema import SkipJsonSchema
from typing_extensions import Literal, Type

from ...state import update_types
from ..command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
    SuccessData,
)
from .common import (
    RecoverableVacuumHwExceptions,
    RecoverableVacuumHwExceptionTypes,
    VacuumModuleCarboyFullError,
    VacuumModuleDefinedErrorData,
    VacuumModulePressureNotReachedError,
    handle_recoverable_vacuum_error,
)
from opentrons.protocol_engine.resources import ModelUtils

if TYPE_CHECKING:
    from opentrons.protocol_engine.execution import (
        EquipmentHandler,
        MovementHandler,
        TaskHandler,
    )
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
    taskId: str | None = Field(None, description="The id of the task")


class StartSetVacuumPowerResult(BaseModel):
    """Result data from starting the vacuum pump."""

    taskId: str = Field(..., description="The id of the task")


_ExecuteReturn = Union[
    SuccessData[StartSetVacuumPowerResult],
    VacuumModuleDefinedErrorData,
]


class StartSetVacuumPowerImpl(
    AbstractCommandImpl[StartSetVacuumPowerParams, _ExecuteReturn]
):
    """Execution implementation of a start set vacuum pump command."""

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

    def handle_recoverable_error(
        self,
        error: RecoverableVacuumHwExceptions,
        state_update: update_types.StateUpdate,
    ) -> VacuumModuleDefinedErrorData:
        """Handle a recoverable error raised during command execution."""
        return handle_recoverable_vacuum_error(
            error=error,
            state_update=state_update,
            model_utils=self._model_utils,
        )

    async def execute(
        self, params: StartSetVacuumPowerParams
    ) -> SuccessData[StartSetVacuumPowerResult]:
        """Start the vacuum pump."""
        state_update = update_types.StateUpdate()
        vm_state = self._state_view.modules.get_vacuum_module_substate(params.moduleId)
        state_update.update_vacuum_module_pump_engaged(
            params.moduleId, params.duration is None
        )
        running_command_id = self._state_view.commands.get_running_command_id()
        if running_command_id is not None:
            state_update.record_module_background_command(
                params.moduleId, running_command_id
            )
        if params.percentPower < 0 or params.percentPower > 100:
            raise ValueError(
                f"pump power {params.percentPower} invalid must be between 1 and 100%"
            )

        vm_hardware = self._equipment.get_module_hardware_api(vm_state.module_id)

        async def start_set_vacuum_power(task_handler: TaskHandler) -> None:
            if vm_hardware is not None:
                try:
                    async with task_handler.synchronize_cancel_latest(
                        vm_state.module_id
                    ):
                        await vm_hardware.set_pump_state(
                            start_pump=True,
                            duty_cycle=params.percentPower,
                            duration_s=params.duration,
                            timeout_s=params.timeout,
                            rate=params.rate,
                            vent_after=params.ventAfter,
                        )

                        if params.duration is not None:
                            await vm_hardware.wait_for_command_duration()
                        else:
                            await vm_hardware.wait_for_target()

                        state_update.update_vacuum_module_pump_engaged(
                            params.moduleId, vm_hardware.pump_running
                        )
                except RecoverableVacuumHwExceptionTypes as error:
                    raise error

        task = await self._task_handler.create_task(
            task_function=start_set_vacuum_power, id=params.taskId
        )

        return SuccessData(
            public=StartSetVacuumPowerResult(taskId=task.id),
            state_update=state_update,
        )


class StartSetVacuumPower(
    BaseCommand[
        StartSetVacuumPowerParams,
        StartSetVacuumPowerResult,
        VacuumModulePressureNotReachedError | VacuumModuleCarboyFullError,
    ]
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
