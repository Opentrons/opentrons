"""Command models to stop shaking the Heater-Shaker Module."""
from __future__ import annotations
from typing import Optional, TYPE_CHECKING
from typing_extensions import Literal, Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate
from opentrons.hardware_control import HardwareControlAPI

if TYPE_CHECKING:
    from opentrons.protocol_engine.state import StateView

StopShakeCommandType = Literal["heaterShakerModule/stopShake"]


class StopShakeParams(BaseModel):
    """Input parameters to stop shaking a Heater-Shaker Module."""

    moduleId: str = Field(..., description="Unique ID of the Heater-Shaker Module.")


class StopShakeResult(BaseModel):
    """Result data from stopping a Heater-Shaker's shake."""


class StopShakeImpl(AbstractCommandImpl[StopShakeParams, StopShakeResult]):
    """Execution implementation of a Heater-Shaker's stop shake command."""

    def __init__(
        self, state_view: StateView, hardware_api: HardwareControlAPI, **kwargs: object
    ) -> None:
        self._state_view = state_view
        self._hardware_api = hardware_api

    async def execute(self, params: StopShakeParams) -> StopShakeResult:
        """Stop a Heater-Shaker's shake."""
        # Allow propagation of ModuleNotLoadedError and WrongModuleTypeError.
        hs_module_view = self._state_view.modules.get_heater_shaker_module_view(
            module_id=params.moduleId
        )

        # Allow propagation of ModuleNotAttachedError.
        hs_hardware_module = hs_module_view.find_hardware(
            attached_modules=self._hardware_api.attached_modules
        )

        if hs_hardware_module is not None:
            await hs_hardware_module.set_speed(rpm=0)
        return StopShakeResult()


class StopShake(BaseCommand[StopShakeParams, StopShakeResult]):
    """A command to stop a Heater-Shaker's shake."""

    commandType: StopShakeCommandType = "heaterShakerModule/stopShake"
    params: StopShakeParams
    result: Optional[StopShakeResult]

    _ImplementationCls: Type[StopShakeImpl] = StopShakeImpl


class StopShakeCreate(BaseCommandCreate[StopShakeParams]):
    """A request to create a Heater-Shaker's stop shake command."""

    commandType: StopShakeCommandType
    params: StopShakeParams

    _CommandCls: Type[StopShake] = StopShake
