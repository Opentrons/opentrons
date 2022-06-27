"""Command models to execute a Thermocycler profile."""
from __future__ import annotations
from typing import List, Optional, TYPE_CHECKING
from typing_extensions import Literal, Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from opentrons.protocol_engine.state import StateView
    from opentrons.protocol_engine.execution import EquipmentHandler


RunProfileCommandType = Literal["thermocycler/runProfile"]


class RunProfileStepParams(BaseModel):
    """Input parameters for an individual Thermocycler profile step"""

    celsius: float = Field(..., description="Target temperature in °C.")
    holdSeconds: int = Field(
        ..., description="Time to hold target temperature at in seconds."
    )


class RunProfileParams(BaseModel):
    """Input parameters to run a Thermocycler profile."""

    moduleId: str = Field(..., description="Unique ID of the Thermocycler.")
    profile: List[RunProfileStepParams] = Field(
        ...,
        description="Array of profile steps with target temperature and temperature hold time.",
    )
    blockMaxVolumeUl: float = Field(
        ...,
        description="Amount of liquid in uL of the most-full well in labware loaded onto the thermocycler.",
    )


class RunProfileResult(BaseModel):
    """Result data from running a Thermocycler profile."""


class RunProfileImpl(AbstractCommandImpl[RunProfileParams, RunProfileResult]):
    """Execution implementation of a Thermocycler's run profile command."""

    def __init__(
        self,
        state_view: StateView,
        equipment: EquipmentHandler,
        **unused_dependencies: object,
    ) -> None:
        self._state_view = state_view
        self._equipment = equipment

    async def execute(self, params: RunProfileParams) -> RunProfileResult:
        """Run a Thermocycler profile."""
        thermocycler_state = self._state_view.modules.get_thermocycler_module_substate(
            params.moduleId
        )
        thermocycler_hardware = self._equipment.get_module_hardware_api(
            thermocycler_state.module_id
        )

        steps = [
            {"temperature": step.celsius, "hold_time_seconds": step.holdSeconds}
            for step in params.profile
        ]

        if thermocycler_hardware is not None:
            await thermocycler_hardware.cycle_temperatures(
                steps=steps, repetitions=1, volume=params.blockMaxVolumeUl
            )

        return RunProfileResult()


class RunProfile(BaseCommand[RunProfileParams, RunProfileResult]):
    """A command to execute a Thermocycler profile run."""

    commandType: RunProfileCommandType = "thermocycler/runProfile"
    params: RunProfileParams
    result: Optional[RunProfileResult]

    _ImplementationCls: Type[RunProfileImpl] = RunProfileImpl


class RunProfileCreate(BaseCommandCreate[RunProfileParams]):
    """A request to execute a Thermocycler profile run."""

    commandType: RunProfileCommandType = "thermocycler/runProfile"
    params: RunProfileParams

    _CommandCls: Type[RunProfile] = RunProfile
