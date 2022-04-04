"""Command models to stop shaking the Heater-Shaker Module."""
from __future__ import annotations
from typing import Optional, TYPE_CHECKING
from typing_extensions import Literal, Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from opentrons.protocol_engine.state import StateView
    from opentrons.protocol_engine.execution import EquipmentHandler

StopShakeCommandType = Literal["heaterShakerModule/stopShake"]


class StopShakeParams(BaseModel):
    """Input parameters to stop shaking a Heater-Shaker Module."""

    moduleId: str = Field(..., description="Unique ID of the Heater-Shaker Module.")


class StopShakeResult(BaseModel):
    """Result data from stopping a Heater-Shaker's shake."""


class StopShakeImpl(AbstractCommandImpl[StopShakeParams, StopShakeResult]):
    """Execution implementation of a Heater-Shaker's stop shake command."""

    def __init__(
        self,
        state_view: StateView,
        equipment: EquipmentHandler,
        **unused_dependencies: object,
    ) -> None:
        self._state_view = state_view
        self._equipment = equipment

    async def execute(self, params: StopShakeParams) -> StopShakeResult:
        """Stop a Heater-Shaker's shake."""
        # Allow propagation of ModuleNotLoadedError and WrongModuleTypeError.
        hs_module_substate = self._state_view.modules.get_heater_shaker_module_substate(
            module_id=params.moduleId
        )

        # Allow propagation of ModuleNotAttachedError.
        hs_hardware_module = self._equipment.get_module_hardware_api(
            hs_module_substate.module_id
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
