"""StartRunProfile command request, result, and implementation models."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, List, Optional, Union, overload

from pydantic import BaseModel, Field
from pydantic.json_schema import SkipJsonSchema
from typing_extensions import Literal, Type

from ...errors.error_occurrence import ErrorOccurrence
from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from .run_extended_profile import ProfileCycle, ProfileStep
from opentrons.hardware_control.modules.types import ThermocyclerCycle, ThermocyclerStep

if TYPE_CHECKING:
    from opentrons.protocol_engine.execution import (
        EquipmentHandler,
        TaskHandler,
    )
    from opentrons.protocol_engine.state.module_substates.thermocycler_module_substate import (
        ThermocyclerModuleSubState,
    )
    from opentrons.protocol_engine.state.state import StateView

StartRunExtendedProfileCommandType = Literal["thermocycler/startRunExtendedProfile"]


def _remove_default(s: dict[str, Any]) -> None:
    s.pop("default", None)


class StartRunExtendedProfileStepParams(BaseModel):
    """Input parameters for an individual Thermocycler profile step."""

    celsius: float = Field(..., description="Target temperature in °C.")
    holdSeconds: float = Field(
        ..., description="Time to hold target temperature at in seconds."
    )
    rampRate: float | SkipJsonSchema[None] = Field(
        None,
        description="How quickly to change temperature in °C/second.",
        json_schema_extra=_remove_default,
    )


class StartRunExtendedProfileParams(BaseModel):
    """Input parameters to run a Thermocycler profile."""

    moduleId: str = Field(..., description="Unique ID of the Thermocycler.")
    profileElements: List[Union[ProfileStep, ProfileCycle]] = Field(
        ...,
        description="Elements of the profile. Each can be either a step or a cycle.",
    )
    blockMaxVolumeUl: float | SkipJsonSchema[None] = Field(
        None,
        description="Amount of liquid in uL of the most-full well"
        " in labware loaded onto the thermocycler.",
        json_schema_extra=_remove_default,
    )
    taskId: str | None = Field(None, description="The id of the profile task")


class StartRunExtendedProfileResult(BaseModel):
    """Result data from running a Thermocycler profile."""

    taskId: str = Field(..., description="The id of the profile task")


def _transform_profile_step(
    step: ProfileStep, thermocycler_state: ThermocyclerModuleSubState
) -> ThermocyclerStep:
    return ThermocyclerStep(
        temperature=thermocycler_state.validate_target_block_temperature(step.celsius),
        hold_time_seconds=step.holdSeconds,
        ramp_rate=thermocycler_state.validate_ramp_rate(step.rampRate, step.celsius),
    )


@overload
def _transform_profile_element(
    element: ProfileStep, thermocycler_state: ThermocyclerModuleSubState
) -> ThermocyclerStep: ...


@overload
def _transform_profile_element(
    element: ProfileCycle, thermocycler_state: ThermocyclerModuleSubState
) -> ThermocyclerCycle: ...


def _transform_profile_element(
    element: Union[ProfileStep, ProfileCycle],
    thermocycler_state: ThermocyclerModuleSubState,
) -> Union[ThermocyclerStep, ThermocyclerCycle]:
    if isinstance(element, ProfileStep):
        return _transform_profile_step(element, thermocycler_state)
    else:
        return ThermocyclerCycle(
            steps=[
                _transform_profile_step(step, thermocycler_state)
                for step in element.steps
            ],
            repetitions=element.repetitions,
        )


class StartRunExtendedProfileImpl(
    AbstractCommandImpl[
        StartRunExtendedProfileParams, SuccessData[StartRunExtendedProfileResult]
    ]
):
    """Execution implementation of a Thermocycler's run profile command."""

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
        self, params: StartRunExtendedProfileParams
    ) -> SuccessData[StartRunExtendedProfileResult]:
        """Run a Thermocycler profile."""
        thermocycler_state = self._state_view.modules.get_thermocycler_module_substate(
            params.moduleId
        )
        thermocycler_hardware = self._equipment.get_module_hardware_api(
            thermocycler_state.module_id
        )

        profile = [
            _transform_profile_element(element, thermocycler_state)
            for element in params.profileElements
        ]
        target_volume: Optional[float]
        if params.blockMaxVolumeUl is not None:
            target_volume = thermocycler_state.validate_max_block_volume(
                params.blockMaxVolumeUl
            )
        else:
            target_volume = None

        async def start_run_profile(task_handler: TaskHandler) -> None:
            if thermocycler_hardware is not None:
                async with task_handler.synchronize_cancel_latest(
                    thermocycler_state.module_id + "-block"
                ):
                    await thermocycler_hardware.execute_profile(
                        profile=profile, volume=target_volume
                    )

        task = await self._task_handler.create_task(
            task_function=start_run_profile, id=params.taskId
        )

        return SuccessData(
            public=StartRunExtendedProfileResult(taskId=task.id),
        )


class StartRunExtendedProfile(
    BaseCommand[
        StartRunExtendedProfileParams, StartRunExtendedProfileResult, ErrorOccurrence
    ]
):
    """A command to start the execution of a Thermocycler profile run without waiting for its completion."""

    commandType: StartRunExtendedProfileCommandType = (
        "thermocycler/startRunExtendedProfile"
    )
    params: StartRunExtendedProfileParams

    _ImplementationCls: Type[StartRunExtendedProfileImpl] = StartRunExtendedProfileImpl


class StartRunExtendedProfileCreate(BaseCommandCreate[StartRunExtendedProfileParams]):
    """A request to execute a Thermocycler profile run."""

    commandType: StartRunExtendedProfileCommandType = (
        "thermocycler/startRunExtendedProfile"
    )
    params: StartRunExtendedProfileParams

    _CommandCls: Type[StartRunExtendedProfile] = StartRunExtendedProfile
