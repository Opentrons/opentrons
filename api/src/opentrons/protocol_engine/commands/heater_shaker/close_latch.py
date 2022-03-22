"""Command models to close the Heater-Shaker Module's latch."""
from __future__ import annotations
from typing import Optional, TYPE_CHECKING
from typing_extensions import Literal, Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate
from opentrons.hardware_control import HardwareControlAPI

if TYPE_CHECKING:
    from opentrons.protocol_engine.state import StateView

CloseLatchCommandType = Literal["heaterShakerModule/closeLatch"]


class CloseLatchParams(BaseModel):
    """Input parameters to close a Heater-Shaker Module's latch."""

    moduleId: str = Field(..., description="Unique ID of the Heater-Shaker Module.")


class CloseLatchResult(BaseModel):
    """Result data from closing a Heater-Shaker's latch."""


class CloseLatchImpl(AbstractCommandImpl[CloseLatchParams, CloseLatchResult]):
    """Execution implementation of a Heater-Shaker's close latch command."""

    def __init__(
            self,
            state_view: StateView,
            hardware_api: HardwareControlAPI,
            **unused_dependencies: object
    ) -> None:
        self._state_view = state_view
        self._hardware_api = hardware_api

    async def execute(self, params: CloseLatchParams) -> CloseLatchResult:
        """Close a Heater-Shaker's latch."""
        # Allow propagation of ModuleNotLoadedError and WrongModuleTypeError.
        hs_module_view = self._state_view.modules.get_heater_shaker_module_view(
            module_id=params.moduleId
        )

        # Allow propagation of ModuleNotAttachedError.
        hs_hardware_module = hs_module_view.find_hardware(
            attached_modules=self._hardware_api.attached_modules
        )

        if hs_hardware_module is not None:
            await hs_hardware_module.close_labware_latch()
        return CloseLatchResult()


class CloseLatch(BaseCommand[CloseLatchParams, CloseLatchResult]):
    """A command to close a Heater-Shaker's latch."""

    commandType: CloseLatchCommandType = "heaterShakerModule/closeLatch"
    params: CloseLatchParams
    result: Optional[CloseLatchResult]

    _ImplementationCls: Type[CloseLatchImpl] = CloseLatchImpl


class CloseLatchCreate(BaseCommandCreate[CloseLatchParams]):
    """A request to create a Heater-Shaker's close latch command."""

    commandType: CloseLatchCommandType
    params: CloseLatchParams

    _CommandCls: Type[CloseLatch] = CloseLatch
