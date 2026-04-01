"""Command models to set a shake speed for a Heater-Shaker Module."""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from pydantic import BaseModel, Field
from typing_extensions import Literal, Type

from ...errors.error_occurrence import ErrorOccurrence
from ...state import update_types
from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from .common import get_heatershaker_ready_to_shake

if TYPE_CHECKING:
    from opentrons.protocol_engine.execution import (
        EquipmentHandler,
        MovementHandler,
        TaskHandler,
    )
    from opentrons.protocol_engine.state.state import StateView

SetShakeSpeedCommandType = Literal["heaterShaker/setShakeSpeed"]


class SetShakeSpeedParams(BaseModel):
    """Input parameters to set a shake speed for a Heater-Shaker Module."""

    moduleId: str = Field(..., description="Unique ID of the Heater-Shaker Module.")
    rpm: float = Field(..., description="Target speed in rotations per minute.")
    taskId: str | None = Field(
        None,
        description="Id for the background task that manages the temperature",
    )


class SetShakeSpeedResult(BaseModel):
    """Result data from setting and waiting for a Heater-Shaker's shake speed."""

    pipetteRetracted: bool = Field(
        ...,
        description=(
            "Whether this command automatically retracted the pipettes"
            " before starting the shake, to avoid a potential collision."
        ),
    )
    taskId: str = Field(
        description="The task id for the setTargetTemperature task",
    )


class SetShakeSpeedImpl(
    AbstractCommandImpl[SetShakeSpeedParams, SuccessData[SetShakeSpeedResult]]
):
    """Execution implementation of Heater-Shaker's set shake speed command."""

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
        self,
        params: SetShakeSpeedParams,
    ) -> SuccessData[SetShakeSpeedResult]:
        """Set a Heater-Shaker's target shake speed."""
        state_update = update_types.StateUpdate()

        # Allow propagation of ModuleNotLoadedError and WrongModuleTypeError.
        hs_module_substate = self._state_view.modules.get_heater_shaker_module_substate(
            module_id=params.moduleId
        )

        validated_speed = await get_heatershaker_ready_to_shake(
            hs_module_substate, params.rpm
        )
        pipette_should_retract = (
            self._state_view.motion.check_pipette_blocking_hs_shaker(
                hs_module_substate.module_id
            )
        )
        if pipette_should_retract:
            # Move pipette away if it is close to the heater-shaker
            # TODO(jbl 2022-07-28) replace home movement with a retract movement
            await self._movement.home(
                axes=self._state_view.motion.get_robot_mount_axes()
            )
            state_update.clear_all_pipette_locations()

        # Allow propagation of ModuleNotAttachedError.
        hs_hardware_module = self._equipment.get_module_hardware_api(
            hs_module_substate.module_id
        )

        async def start_shake(task_handler: TaskHandler) -> None:
            if hs_hardware_module is not None:
                async with task_handler.synchronize_cancel_previous(
                    hs_module_substate.module_id + "-shake"
                ):
                    await hs_hardware_module.set_speed(rpm=validated_speed)

        task = await self._task_handler.create_task(
            task_function=start_shake, id=params.taskId
        )
        return SuccessData(
            public=SetShakeSpeedResult(
                pipetteRetracted=pipette_should_retract, taskId=task.id
            ),
            state_update=state_update,
        )


class SetShakeSpeed(
    BaseCommand[SetShakeSpeedParams, SetShakeSpeedResult, ErrorOccurrence]
):
    """A command to set a Heater-Shaker's shake speed."""

    commandType: SetShakeSpeedCommandType = "heaterShaker/setShakeSpeed"
    params: SetShakeSpeedParams
    result: Optional[SetShakeSpeedResult] = None

    _ImplementationCls: Type[SetShakeSpeedImpl] = SetShakeSpeedImpl


class SetShakeSpeedCreate(BaseCommandCreate[SetShakeSpeedParams]):
    """A request to create a Heater-Shaker's set shake speed command."""

    commandType: SetShakeSpeedCommandType = "heaterShaker/setShakeSpeed"
    params: SetShakeSpeedParams

    _CommandCls: Type[SetShakeSpeed] = SetShakeSpeed
