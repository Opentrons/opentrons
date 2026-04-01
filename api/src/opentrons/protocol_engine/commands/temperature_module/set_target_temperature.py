"""Command models to start heating a Temperature Module."""

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

SetTargetTemperatureCommandType = Literal["temperatureModule/setTargetTemperature"]


def _remove_default(s: dict[str, Any]) -> None:
    s.pop("default", None)


class SetTargetTemperatureParams(BaseModel):
    """Input parameters to set a Temperature Module's target temperature."""

    moduleId: str = Field(..., description="Unique ID of the Temperature Module.")
    celsius: float = Field(..., description="Target temperature in °C.")
    taskId: str | SkipJsonSchema[None] = Field(
        None,
        description="Id for the background task that manages the temperature",
        json_schema_extra=_remove_default,
    )


class SetTargetTemperatureResult(BaseModel):
    """Result data from setting a Temperature Module's target temperature."""

    targetTemperature: float = Field(
        ...,
        description="The target temperature that was set after validation "
        "and type conversion (if any).",
    )
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
    """Execution implementation of a Temperature Module's set temperature command."""

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
        self, params: SetTargetTemperatureParams
    ) -> SuccessData[SetTargetTemperatureResult]:
        """Set a Temperature Module's target temperature."""
        # Allow propagation of ModuleNotLoadedError and WrongModuleTypeError.
        module_substate = self._state_view.modules.get_temperature_module_substate(
            module_id=params.moduleId
        )
        # Verify temperature from temperature module view
        validated_temp = module_substate.validate_target_temperature(params.celsius)
        # Allow propagation of ModuleNotAttachedError.
        temp_hardware_module = self._equipment.get_module_hardware_api(
            module_substate.module_id
        )

        async def start_set_temperature(task_handler: TaskHandler) -> None:
            if temp_hardware_module is not None:
                async with task_handler.synchronize_cancel_previous(
                    module_substate.module_id
                ):
                    await temp_hardware_module.start_set_temperature(
                        celsius=validated_temp
                    )
                    await temp_hardware_module.await_temperature(
                        awaiting_temperature=validated_temp
                    )

        task = await self._task_handler.create_task(
            task_function=start_set_temperature, id=params.taskId
        )

        return SuccessData(
            public=SetTargetTemperatureResult(
                targetTemperature=validated_temp, taskId=task.id
            ),
        )


class SetTargetTemperature(
    BaseCommand[SetTargetTemperatureParams, SetTargetTemperatureResult, ErrorOccurrence]
):
    """A command to set a Temperature Module's target temperature."""

    commandType: SetTargetTemperatureCommandType = (
        "temperatureModule/setTargetTemperature"
    )
    params: SetTargetTemperatureParams
    result: Optional[SetTargetTemperatureResult] = None

    _ImplementationCls: Type[SetTargetTemperatureImpl] = SetTargetTemperatureImpl


class SetTargetTemperatureCreate(BaseCommandCreate[SetTargetTemperatureParams]):
    """A request to create a Temperature Module's set temperature command."""

    commandType: SetTargetTemperatureCommandType = (
        "temperatureModule/setTargetTemperature"
    )
    params: SetTargetTemperatureParams

    _CommandCls: Type[SetTargetTemperature] = SetTargetTemperature
