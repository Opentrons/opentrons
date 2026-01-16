"""Command models to start heating a Heater-Shaker Module."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, Optional

from pydantic import BaseModel, Field
from pydantic.json_schema import SkipJsonSchema
from typing_extensions import Literal, Type

from ...errors.error_occurrence import ErrorOccurrence
from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData

if TYPE_CHECKING:
    from opentrons.protocol_engine.execution import EquipmentHandler, TaskHandler
    from opentrons.protocol_engine.state.state import StateView


SetTargetTemperatureCommandType = Literal["heaterShaker/setTargetTemperature"]


def _remove_default(s: dict[str, Any]) -> None:
    s.pop("default", None)


class SetTargetTemperatureParams(BaseModel):
    """Input parameters to set a Heater-Shaker's target temperature."""

    moduleId: str = Field(..., description="Unique ID of the Heater-Shaker Module.")
    celsius: float = Field(..., description="Target temperature in °C.")
    taskId: str | SkipJsonSchema[None] = Field(
        None,
        description="Id for the background task that manages the temperature",
        json_schema_extra=_remove_default,
    )


class SetTargetTemperatureResult(BaseModel):
    """Result data from setting a Heater-Shaker's target temperature."""

    taskId: str | SkipJsonSchema[None] = Field(
        None,
        description="The task id for the setTargetTemperature task",
        json_schema_extra=_remove_default,
    )


class SetTargetTemperatureImpl(
    AbstractCommandImpl[
        SetTargetTemperatureParams, SuccessData[SetTargetTemperatureResult]
    ]
):
    """Execution implementation of a Heater-Shaker's set temperature command."""

    def __init__(
        self,
        state_view: StateView,
        equipment: EquipmentHandler,
        task_handler: TaskHandler,
        **unused_dependencies: object,
    ) -> None:
        self._state_view = state_view
        self._equipment = equipment
        self._task_handler = task_handler

    async def execute(
        self,
        params: SetTargetTemperatureParams,
    ) -> SuccessData[SetTargetTemperatureResult]:
        """Set a Heater-Shaker's target temperature."""
        # Allow propagation of ModuleNotLoadedError and WrongModuleTypeError.
        hs_module_substate = self._state_view.modules.get_heater_shaker_module_substate(
            module_id=params.moduleId
        )

        # Verify temperature from hs module view
        validated_temp = hs_module_substate.validate_target_temperature(params.celsius)

        # Allow propagation of ModuleNotAttachedError.
        hs_hardware_module = self._equipment.get_module_hardware_api(
            hs_module_substate.module_id
        )

        async def start_set_temperature(task_handler: TaskHandler) -> None:
            if hs_hardware_module is not None:
                async with task_handler.synchronize_cancel_previous(
                    hs_module_substate.module_id + "-temp"
                ):
                    await hs_hardware_module.start_set_temperature(validated_temp)
                    await hs_hardware_module.await_temperature(validated_temp)

        task = await self._task_handler.create_task(
            task_function=start_set_temperature, id=params.taskId
        )
        return SuccessData(
            public=SetTargetTemperatureResult(taskId=task.id),
        )


class SetTargetTemperature(
    BaseCommand[SetTargetTemperatureParams, SetTargetTemperatureResult, ErrorOccurrence]
):
    """A command to set a Heater-Shaker's target temperature."""

    commandType: SetTargetTemperatureCommandType = "heaterShaker/setTargetTemperature"
    params: SetTargetTemperatureParams
    result: Optional[SetTargetTemperatureResult] = None

    _ImplementationCls: Type[SetTargetTemperatureImpl] = SetTargetTemperatureImpl


class SetTargetTemperatureCreate(BaseCommandCreate[SetTargetTemperatureParams]):
    """A request to create a Heater-Shaker's set temperature command."""

    commandType: SetTargetTemperatureCommandType = "heaterShaker/setTargetTemperature"
    params: SetTargetTemperatureParams

    _CommandCls: Type[SetTargetTemperature] = SetTargetTemperature
