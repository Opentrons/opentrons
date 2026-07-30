"""Command models to run a vacuum module profile."""

from __future__ import annotations

from typing import TYPE_CHECKING, List, Optional, Union

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
from opentrons.drivers.vacuum_module.driver import MAX_VAC_DURATION_S
from opentrons.hardware_control.modules.types import (
    VacuumModuleCycle,
    VacuumModulePowerStep,
    VacuumModulePressureStep,
    VacuumModuleStep,
)
from opentrons.hardware_control.modules.types import (
    VacuumModuleProfileStep as hc_profile_step,
)
from opentrons.protocol_engine.commands.vacuum_module.common import (
    will_equalize_after_operation,
)
from opentrons.protocol_engine.resources import ModelUtils

if TYPE_CHECKING:
    from opentrons.protocol_engine.execution import EquipmentHandler, TaskHandler
    from opentrons.protocol_engine.state.state import StateView

StartRunProfileCommandType = Literal["vacuumModule/startRunProfile"]


class VacuumModuleProfileStepBase(BaseModel):
    """The parameters shared between a pressure step and a power step."""

    enablePump: bool
    holdTimeSeconds: int | SkipJsonSchema[None] = None
    holdTimeMinutes: int | SkipJsonSchema[None] = None
    rampRate: float | SkipJsonSchema[None] = None
    timeoutSeconds: int | SkipJsonSchema[None] = None
    ventAfter: bool | SkipJsonSchema[None] = None


class VacuumModuleProfilePowerStep(VacuumModuleProfileStepBase):
    """Input parameters for a vacuum module Power Step."""

    percentPower: int | SkipJsonSchema[None] = None

    def convert_element(self) -> VacuumModulePowerStep:
        """Convert a VacuumModulePower step into a hardware controller type."""
        return VacuumModulePowerStep(
            enable_pump=self.enablePump,
            hold_time_seconds=self.holdTimeSeconds if self.holdTimeSeconds else None,
            hold_time_minutes=self.holdTimeMinutes if self.holdTimeMinutes else None,
            ramp_rate=self.rampRate if self.rampRate else None,
            timeout_seconds=self.timeoutSeconds if self.timeoutSeconds else None,
            vent_after=self.ventAfter if self.ventAfter is not None else None,
            percent_power=self.percentPower if self.percentPower else None,
        )


class VacuumModuleProfilePressureStep(VacuumModuleProfileStepBase):
    """Input parameters for a vacuum module Pressure Step."""

    gaugePressureMbar: int | SkipJsonSchema[None] = None

    def convert_element(self) -> VacuumModulePressureStep:
        """Convert a VacuumModulePressure step into a hardware controller type."""
        return VacuumModulePressureStep(
            enable_pump=self.enablePump,
            hold_time_seconds=self.holdTimeSeconds if self.holdTimeSeconds else None,
            hold_time_minutes=self.holdTimeMinutes if self.holdTimeMinutes else None,
            ramp_rate=self.rampRate if self.rampRate else None,
            timeout_seconds=self.timeoutSeconds if self.timeoutSeconds else None,
            vent_after=self.ventAfter if self.ventAfter is not None else None,
            gauge_pressure_mbar=self.gaugePressureMbar
            if self.gaugePressureMbar
            else None,
        )


class VacuumModuleProfileCycle(BaseModel):
    """Input parameters for a vacuum module cycle."""

    steps: List[StartRunProfileStepParams]
    repetitions: int
    ventAfter: bool | SkipJsonSchema[None] = None

    def convert_element(self) -> VacuumModuleCycle:
        """Convert a VacuumModuleCycle into a hardware controller type."""
        steps: List[VacuumModuleStep] = []
        for step in self.steps:
            steps.append(step.convert_element())
        return VacuumModuleCycle(
            steps=steps,
            repetitions=self.repetitions,
            vent_after=self.ventAfter,
        )


StartRunProfileStepParams = Union[
    VacuumModuleProfilePowerStep,
    VacuumModuleProfilePressureStep,
]

ProfileType = List[Union[StartRunProfileStepParams, VacuumModuleProfileCycle]]


class StartRunProfileParams(BaseModel):
    """Input parameters to run a vacuum profile."""

    moduleId: str = Field(..., description="Unique ID of the vacuum module.")
    profile: ProfileType = Field(
        ..., description="List of Vacuum Module profile steps."
    )
    ventAfter: bool = Field(
        False, description="Whether to open the vent after the profile is complete."
    )
    equalizeTimeout: int | SkipJsonSchema[None] = Field(
        None,
        description="Time in seconds to wait for pressure equalization after the profile completes if ventAfter is True. Does not wait if None.",
    )
    taskId: str | None = Field(None, description="The id of the profile task")


class StartRunProfileResult(BaseModel):
    """Result data from running a vacuum profile."""

    taskId: str = Field(..., description="The id of the profile task")


_ExecuteReturn = Union[SuccessData[StartRunProfileResult],]


class StartRunProfileImpl(AbstractCommandImpl[StartRunProfileParams, _ExecuteReturn]):
    """Execution implementation of a run vacuum profile command."""

    def __init__(
        self,
        state_view: StateView,
        equipment: EquipmentHandler,
        task_handler: TaskHandler,
        model_utils: ModelUtils,
        **unused_dependencies: object,
    ) -> None:
        self._state_view = state_view
        self._equipment = equipment
        self._task_handler = task_handler
        self._model_utils = model_utils

    async def execute(
        self, params: StartRunProfileParams
    ) -> SuccessData[StartRunProfileResult]:
        """Run a vacuum module profile."""
        e_timeout = params.equalizeTimeout
        if e_timeout is not None and (e_timeout < 0 or e_timeout > MAX_VAC_DURATION_S):
            raise ValueError(
                f"Equalize timeout {e_timeout} is invalid, must be between 0-{MAX_VAC_DURATION_S} seconds."
            )

        clears_residual = will_equalize_after_operation(
            vent_after=params.ventAfter,
            equalize_timeout=params.equalizeTimeout,
            require_duration=False,
        )

        state_update = update_types.StateUpdate()
        profile: List[hc_profile_step] = []
        pump_engaged = False
        for step in params.profile:
            profile.append(step.convert_element())
            if not isinstance(step, VacuumModuleProfileCycle):
                pump_engaged = step.enablePump

        state_update.update_vacuum_module_pump_engaged(params.moduleId, pump_engaged)
        # Profiles apply vacuum unless the whole profile equalizes at the end.
        state_update.update_vacuum_module_residual_vacuum(
            params.moduleId, not clears_residual
        )
        running_command_id = self._state_view.commands.get_running_command_id()
        if running_command_id is not None:
            state_update.record_module_background_command(
                params.moduleId, running_command_id
            )

        vm_state = self._state_view.modules.get_vacuum_module_substate(params.moduleId)
        vm_hardware = self._equipment.get_module_hardware_api(vm_state.module_id)

        async def start_run_profile(task_handler: TaskHandler) -> None:
            if vm_hardware is not None:
                async with task_handler.synchronize_cancel_latest(vm_state.module_id):
                    await vm_hardware.execute_profile(
                        profile=profile, vent_after=params.ventAfter
                    )

                    # Wait until we equalize pressure if the vent is open and the
                    # pump is off
                    if (
                        params.equalizeTimeout is not None
                        and not vm_hardware.pump_running
                        and params.ventAfter
                    ):
                        await vm_hardware.wait_for_pressure_equalization(
                            params.equalizeTimeout
                        )

                    state_update.update_vacuum_module_pump_engaged(
                        params.moduleId, vm_hardware.pump_running
                    )

        task = await self._task_handler.create_task(
            task_function=start_run_profile, id=params.taskId
        )

        return SuccessData(
            public=StartRunProfileResult(taskId=task.id), state_update=state_update
        )


class StartRunProfile(
    BaseCommand[
        StartRunProfileParams,
        StartRunProfileResult,
        ErrorOccurrence,
    ]
):
    """A command to run a vacuum module profile."""

    commandType: StartRunProfileCommandType = "vacuumModule/startRunProfile"
    params: StartRunProfileParams
    result: Optional[StartRunProfileResult] = None

    _ImplementationCls: Type[StartRunProfileImpl] = StartRunProfileImpl


class StartRunProfileCreate(BaseCommandCreate[StartRunProfileParams]):
    """A request to run a vacuum module profile."""

    commandType: StartRunProfileCommandType = "vacuumModule/startRunProfile"
    params: StartRunProfileParams

    _CommandCls: Type[StartRunProfile] = StartRunProfile
