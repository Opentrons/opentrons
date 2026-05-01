"""Command models to run a vacuum module profile."""

from __future__ import annotations

from typing import TYPE_CHECKING, List, Optional, Union

from pydantic import BaseModel, Field
from pydantic.json_schema import SkipJsonSchema
from typing_extensions import Literal, Type

from ...errors.error_occurrence import ErrorOccurrence
from ...state import update_types
from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from opentrons.hardware_control.modules.types import (
    VacuumModuleCycle,
    VacuumModulePowerStep,
    VacuumModulePressureStep,
    VacuumModuleStep,
)

if TYPE_CHECKING:
    from opentrons.protocol_engine.execution import EquipmentHandler
    from opentrons.protocol_engine.state.state import StateView

RunProfileCommandType = Literal["vacuumModule/runProfile"]


class VacuumModuleProfileStepBase(BaseModel):
    """The parameters shared between a pressure step and a power step."""

    enablePump: bool
    holdTimeSeconds: int | SkipJsonSchema[None]
    holdTimeMinutes: int | SkipJsonSchema[None]
    rampRate: float | SkipJsonSchema[None]
    timeoutSeconds: int | SkipJsonSchema[None]
    ventAfter: bool | SkipJsonSchema[None]


class VacuumModuleProfilePowerStep(VacuumModuleProfileStepBase):
    """Input parameters for a vacuum module Power Step."""

    percentPower: int | SkipJsonSchema[None]

    def convert_step(self) -> VacuumModulePowerStep:
        """Convert a VacuumModulePower step into a hardware controller type."""
        return VacuumModulePowerStep(
            enable_pump=self.enablePump,
            hold_time_seconds=self.holdTimeSeconds if self.holdTimeSeconds else None,
            hold_time_minutes=self.holdTimeMinutes if self.holdTimeMinutes else None,
            ramp_rate=self.rampRate if self.rampRate else None,
            timeout_seconds=self.timeoutSeconds if self.timeoutSeconds else None,
            percent_power=self.percentPower if self.percentPower else None,
        )


class VacuumModuleProfilePressureStep(VacuumModuleProfileStepBase):
    """Input parameters for a vacuum module Pressure Step."""

    gaugePressureMbar: int | SkipJsonSchema[None]

    def convert_step(self) -> VacuumModulePressureStep:
        """Convert a VacuumModulePressure step into a hardware controller type."""
        return VacuumModulePressureStep(
            enable_pump=self.enablePump,
            hold_time_seconds=self.holdTimeSeconds if self.holdTimeSeconds else None,
            hold_time_minutes=self.holdTimeMinutes if self.holdTimeMinutes else None,
            ramp_rate=self.rampRate if self.rampRate else None,
            timeout_seconds=self.timeoutSeconds if self.timeoutSeconds else None,
            gauge_pressure_mbar=self.gaugePressureMbar
            if self.gaugePressureMbar
            else None,
        )


class VacuumModuleProfileCycle(BaseModel):
    """Input parameters for a vacuum module cycle."""

    steps: List[RunProfileStepParams]
    repetitions: int

    def convert_step(self) -> VacuumModuleCycle:
        """Convert a VacuumModuleCycle into a hardware controller type."""
        steps: List[VacuumModuleStep] = []
        for step in self.steps:
            steps.append(step.convert_step())
        return VacuumModuleCycle(steps=steps, repetitions=self.repetitions)


RunProfileStepParams = Union[
    VacuumModuleProfilePowerStep,
    VacuumModuleProfilePressureStep,
]

ProfileType = List[Union[RunProfileStepParams, VacuumModuleProfileCycle]]


class RunProfileParams(BaseModel):
    """Input parameters to run a vacuum profile."""

    moduleId: str = Field(..., description="Unique ID of the vacuum module.")
    profile: ProfileType = Field(
        ..., description="List of Vacuum Module profile steps."
    )


class RunProfileResult(BaseModel):
    """Result data from running a vacuum profile."""


class RunProfileImpl(
    AbstractCommandImpl[RunProfileParams, SuccessData[RunProfileResult]]
):
    """Execution implementation of a run vacuum profile command."""

    def __init__(
        self,
        state_view: StateView,
        equipment: EquipmentHandler,
        **unused_dependencies: object,
    ) -> None:
        self._state_view = state_view
        self._equipment = equipment

    async def execute(self, params: RunProfileParams) -> SuccessData[RunProfileResult]:
        """Run a vacuum module profile."""
        state_update = update_types.StateUpdate()
        vm_state = self._state_view.modules.get_vacuum_module_substate(params.moduleId)
        vm_hardware = self._equipment.get_module_hardware_api(vm_state.module_id)
        if vm_hardware is not None:
            steps: List[
                Union[
                    VacuumModulePressureStep, VacuumModulePowerStep, VacuumModuleCycle
                ]
            ] = []
            for step in params.profile:
                steps.append(step.convert_step())
            await vm_hardware.execute_profile(profile=steps)

        return SuccessData(public=RunProfileResult(), state_update=state_update)


class RunProfile(BaseCommand[RunProfileParams, RunProfileResult, ErrorOccurrence]):
    """A command to run a vacuum module profile."""

    commandType: RunProfileCommandType = "vacuumModule/runProfile"
    params: RunProfileParams
    result: Optional[RunProfileResult] = None

    _ImplementationCls: Type[RunProfileImpl] = RunProfileImpl


class RunProfileCreate(BaseCommandCreate[RunProfileParams]):
    """A request to run a vacuum module profile."""

    commandType: RunProfileCommandType = "vacuumModule/runProfile"
    params: RunProfileParams

    _CommandCls: Type[RunProfile] = RunProfile
