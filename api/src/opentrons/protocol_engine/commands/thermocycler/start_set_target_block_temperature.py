"""Command models to start heating a Thermocycler's block."""
from __future__ import annotations
from typing import Optional, TYPE_CHECKING, Any
from typing_extensions import Literal, Type

from pydantic import BaseModel, Field
from pydantic.json_schema import SkipJsonSchema

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ...errors.error_occurrence import ErrorOccurrence

if TYPE_CHECKING:
    from opentrons.protocol_engine.state.state import StateView
    from opentrons.protocol_engine.execution import EquipmentHandler, TaskHandler


StartSetTargetBlockTemperatureCommandType = Literal[
    "thermocycler/startSetTargetBlockTemperature"
]


def _remove_default(s: dict[str, Any]) -> None:
    s.pop("default", None)


class StartSetTargetBlockTemperatureParams(BaseModel):
    """Input parameters to set a Thermocycler's target block temperature."""

    moduleId: str = Field(..., description="Unique ID of the Thermocycler Module.")
    celsius: float = Field(..., description="Target temperature in °C.")
    blockMaxVolumeUl: float | SkipJsonSchema[None] = Field(
        None,
        description="Amount of liquid in uL of the most-full well"
        " in labware loaded onto the thermocycler.",
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


class StartSetTargetBlockTemperatureResult(BaseModel):
    """Result data from setting a Thermocycler's target block temperature."""

    targetBlockTemperature: float = Field(
        ...,
        description="The target block temperature that was set after validation.",
    )
    taskId: str | SkipJsonSchema[None] = Field(
        None,
        description="The task id for the startSetTargetBlockTemperature",
        json_schema_extra=_remove_default,
    )


class StartSetTargetBlockTemperatureImpl(
    AbstractCommandImpl[
        StartSetTargetBlockTemperatureParams,
        SuccessData[StartSetTargetBlockTemperatureResult],
    ]
):
    """Execution implementation of a Thermocycler's start set block temperature command."""

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
        params: StartSetTargetBlockTemperatureParams,
    ) -> SuccessData[StartSetTargetBlockTemperatureResult]:
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
                await thermocycler_hardware.set_target_block_temperature(
                    target_temperature,
                    volume=target_volume,
                    ramp_rate=target_ramp_rate,
                )
                await thermocycler_hardware.wait_for_block_target()

        task = await self._task_handler.create_task(
            task_function=set_target_block_temperature, id=params.taskId
        )

        return SuccessData(
            public=StartSetTargetBlockTemperatureResult(
                targetBlockTemperature=target_temperature, taskId=task.id
            ),
        )


class StartSetTargetBlockTemperature(
    BaseCommand[
        StartSetTargetBlockTemperatureParams,
        StartSetTargetBlockTemperatureResult,
        ErrorOccurrence,
    ]
):
    """A command to set a Thermocycler's target block temperature."""

    commandType: StartSetTargetBlockTemperatureCommandType = (
        "thermocycler/startSetTargetBlockTemperature"
    )
    params: StartSetTargetBlockTemperatureParams
    result: Optional[StartSetTargetBlockTemperatureResult] = None

    _ImplementationCls: Type[
        StartSetTargetBlockTemperatureImpl
    ] = StartSetTargetBlockTemperatureImpl


class StartSetTargetBlockTemperatureCreate(
    BaseCommandCreate[StartSetTargetBlockTemperatureParams]
):
    """A request to create a Thermocycler's set block temperature command."""

    commandType: StartSetTargetBlockTemperatureCommandType = (
        "thermocycler/startSetTargetBlockTemperature"
    )
    params: StartSetTargetBlockTemperatureParams

    _CommandCls: Type[StartSetTargetBlockTemperature] = StartSetTargetBlockTemperature
