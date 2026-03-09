"""Command models for heating a Thermocycler's lid."""

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

SetTargetLidTemperatureCommandType = Literal["thermocycler/setTargetLidTemperature"]


def _remove_default(s: dict[str, Any]) -> None:
    s.pop("default", None)


class SetTargetLidTemperatureParams(BaseModel):
    """Input parameters to  to set a Thermocycler's target lid temperature."""

    moduleId: str = Field(..., description="Unique ID of the Thermocycler Module.")
    celsius: float = Field(..., description="Target temperature in °C.")
    taskId: str | SkipJsonSchema[None] = Field(
        None,
        description="Id for the background task that manages the temperature.",
        json_schema_extra=_remove_default,
    )


class SetTargetLidTemperatureResult(BaseModel):
    """Result data from setting a Thermocycler's target lid temperature."""

    targetLidTemperature: float = Field(
        ...,
        description="The target lid temperature that was set after validation.",
    )
    taskId: str | SkipJsonSchema[None] = Field(
        None,
        description="The task id for the setTargetBlockTemperature",
        json_schema_extra=_remove_default,
    )


class SetTargetLidTemperatureImpl(
    AbstractCommandImpl[
        SetTargetLidTemperatureParams,
        SuccessData[SetTargetLidTemperatureResult],
    ]
):
    """Execution implementation of a Thermocycler's  to set lid temperature command."""

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
        params: SetTargetLidTemperatureParams,
    ) -> SuccessData[SetTargetLidTemperatureResult]:
        """To set a Thermocycler's target lid temperature."""
        thermocycler_state = self._state_view.modules.get_thermocycler_module_substate(
            params.moduleId
        )
        target_temperature = thermocycler_state.validate_target_lid_temperature(
            params.celsius
        )
        thermocycler_hardware = self._equipment.get_module_hardware_api(
            thermocycler_state.module_id
        )

        async def set_target_lid_temperature(task_handler: TaskHandler) -> None:
            if thermocycler_hardware is not None:
                async with task_handler.synchronize_cancel_latest(
                    thermocycler_state.module_id + "-lid"
                ):
                    await thermocycler_hardware.set_target_lid_temperature(
                        target_temperature
                    )
                    await thermocycler_hardware.wait_for_lid_target()

        task = await self._task_handler.create_task(
            task_function=set_target_lid_temperature, id=params.taskId
        )
        return SuccessData(
            public=SetTargetLidTemperatureResult(
                targetLidTemperature=target_temperature, taskId=task.id
            ),
        )


class SetTargetLidTemperature(
    BaseCommand[
        SetTargetLidTemperatureParams,
        SetTargetLidTemperatureResult,
        ErrorOccurrence,
    ]
):
    """A command to  to set a Thermocycler's target lid temperature."""

    commandType: SetTargetLidTemperatureCommandType = (
        "thermocycler/setTargetLidTemperature"
    )
    params: SetTargetLidTemperatureParams
    result: Optional[SetTargetLidTemperatureResult] = None

    _ImplementationCls: Type[SetTargetLidTemperatureImpl] = SetTargetLidTemperatureImpl


class SetTargetLidTemperatureCreate(BaseCommandCreate[SetTargetLidTemperatureParams]):
    """A request to create a Thermocycler's set lid temperature command."""

    commandType: SetTargetLidTemperatureCommandType = (
        "thermocycler/setTargetLidTemperature"
    )
    params: SetTargetLidTemperatureParams

    _CommandCls: Type[SetTargetLidTemperature] = SetTargetLidTemperature
