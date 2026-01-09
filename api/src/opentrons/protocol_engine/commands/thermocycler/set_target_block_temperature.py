"""Command models for heating a Thermocycler's block."""

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


SetTargetBlockTemperatureCommandType = Literal["thermocycler/setTargetBlockTemperature"]


def _remove_default(s: dict[str, Any]) -> None:
    s.pop("default", None)


class SetTargetBlockTemperatureParams(BaseModel):
    """Input parameters to set a Thermocycler's target block temperature."""

    moduleId: str = Field(..., description="Unique ID of the Thermocycler Module.")
    celsius: float = Field(..., description="Target temperature in °C.")
    blockMaxVolumeUl: float | SkipJsonSchema[None] = Field(
        None,
        description="Amount of liquid in uL of the most-full well"
        " in labware loaded onto the thermocycler.",
        json_schema_extra=_remove_default,
    )
    holdTimeSeconds: float | SkipJsonSchema[None] = Field(
        None,
        description="Amount of time, in seconds, to hold the temperature for."
        " If specified, a waitForBlockTemperature command will block until"
        " the given hold time has elapsed.",
        json_schema_extra=_remove_default,
    )
    ramp_rate: float | SkipJsonSchema[None] = Field(
        None,
        description="The rate in C°/second to change temperature from the current target."
        " If unspecified, the Thermocycler will change temperature at the fastest possible rate.",
        json_schema_extra=_remove_default,
    )
    taskId: str | SkipJsonSchema[None] = Field(
        None,
        description="Id for the background task that manages the temperature.",
        json_schema_extra=_remove_default,
    )


class SetTargetBlockTemperatureResult(BaseModel):
    """Result data from setting a Thermocycler's target block temperature."""

    targetBlockTemperature: float = Field(
        ...,
        description="The target block temperature that was set after validation.",
    )
    taskId: str | SkipJsonSchema[None] = Field(
        None,
        description="Id for the background task that manages the temperature.",
        json_schema_extra=_remove_default,
    )


class SetTargetBlockTemperatureImpl(
    AbstractCommandImpl[
        SetTargetBlockTemperatureParams,
        SuccessData[SetTargetBlockTemperatureResult],
    ]
):
    """Execution implementation of a Thermocycler's set block temperature command."""

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
        params: SetTargetBlockTemperatureParams,
    ) -> SuccessData[SetTargetBlockTemperatureResult]:
        """Set a Thermocycler's target block temperature."""
        thermocycler_state = self._state_view.modules.get_thermocycler_module_substate(
            params.moduleId
        )
        target_temperature = thermocycler_state.validate_target_block_temperature(
            params.celsius
        )
        target_volume: Optional[float]
        if params.blockMaxVolumeUl is not None:
            target_volume = thermocycler_state.validate_max_block_volume(
                params.blockMaxVolumeUl
            )
        else:
            target_volume = None
        hold_time: Optional[float]
        if params.holdTimeSeconds is not None:
            hold_time = thermocycler_state.validate_hold_time(params.holdTimeSeconds)
        else:
            hold_time = None
        target_ramp_rate: Optional[float]
        if params.ramp_rate is not None:
            target_ramp_rate = thermocycler_state.validate_ramp_rate(
                params.ramp_rate, target_temperature
            )
        else:
            target_ramp_rate = None

        thermocycler_hardware = self._equipment.get_module_hardware_api(
            thermocycler_state.module_id
        )

        async def set_target_block_temperature(task_handler: TaskHandler) -> None:
            if thermocycler_hardware is not None:
                async with task_handler.synchronize_cancel_latest(
                    thermocycler_state.module_id + "-block"
                ):
                    await thermocycler_hardware.set_target_block_temperature(
                        celsius=target_temperature,
                        volume=target_volume,
                        ramp_rate=target_ramp_rate,
                        hold_time_seconds=hold_time,
                    )
                    await thermocycler_hardware.wait_for_block_target()

        task = await self._task_handler.create_task(
            task_function=set_target_block_temperature, id=params.taskId
        )

        return SuccessData(
            public=SetTargetBlockTemperatureResult(
                targetBlockTemperature=target_temperature, taskId=task.id
            ),
        )


class SetTargetBlockTemperature(
    BaseCommand[
        SetTargetBlockTemperatureParams,
        SetTargetBlockTemperatureResult,
        ErrorOccurrence,
    ]
):
    """A command to set a Thermocycler's target block temperature."""

    commandType: SetTargetBlockTemperatureCommandType = (
        "thermocycler/setTargetBlockTemperature"
    )
    params: SetTargetBlockTemperatureParams
    result: Optional[SetTargetBlockTemperatureResult] = None

    _ImplementationCls: Type[SetTargetBlockTemperatureImpl] = (
        SetTargetBlockTemperatureImpl
    )


class SetTargetBlockTemperatureCreate(
    BaseCommandCreate[SetTargetBlockTemperatureParams]
):
    """A request to create a Thermocycler's set block temperature command."""

    commandType: SetTargetBlockTemperatureCommandType = (
        "thermocycler/setTargetBlockTemperature"
    )
    params: SetTargetBlockTemperatureParams

    _CommandCls: Type[SetTargetBlockTemperature] = SetTargetBlockTemperature
