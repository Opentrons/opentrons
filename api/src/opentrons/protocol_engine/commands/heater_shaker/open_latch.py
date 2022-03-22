"""Command models to open the Heater-Shaker Module's latch."""
from __future__ import annotations
from typing import Optional, TYPE_CHECKING
from typing_extensions import Literal, Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate
from opentrons.hardware_control import HardwareControlAPI

if TYPE_CHECKING:
    from opentrons.protocol_engine.state import StateView

OpenLatchCommandType = Literal["heaterShakerModule/openLatch"]


class OpenLatchParams(BaseModel):
    """Input parameters to open a Heater-Shaker Module's latch."""

    moduleId: str = Field(..., description="Unique ID of the Heater-Shaker Module.")


class OpenLatchResult(BaseModel):
    """Result data from opening a Heater-Shaker's latch."""


class OpenLatchImpl(AbstractCommandImpl[OpenLatchParams, OpenLatchResult]):
    """Execution implementation of a Heater-Shaker's open latch command."""

    def __init__(
            self,
            state_view: StateView,
            hardware_api: HardwareControlAPI,
            **unused_dependencies: object
    ) -> None:
        self._state_view = state_view
        self._hardware_api = hardware_api

    async def execute(self, params: OpenLatchParams) -> OpenLatchResult:
        """Open a Heater-Shaker's latch."""
        # Allow propagation of ModuleNotLoadedError and WrongModuleTypeError.
        hs_module_view = self._state_view.modules.get_heater_shaker_module_view(
            module_id=params.moduleId
        )

        # Allow propagation of ModuleNotAttachedError.
        hs_hardware_module = hs_module_view.find_hardware(
            attached_modules=self._hardware_api.attached_modules
        )

        if hs_hardware_module is not None:
            await hs_hardware_module.open_labware_latch()
        return OpenLatchResult()


class OpenLatch(BaseCommand[OpenLatchParams, OpenLatchResult]):
    """A command to open a Heater-Shaker's latch."""

    commandType: OpenLatchCommandType = "heaterShakerModule/openLatch"
    params: OpenLatchParams
    result: Optional[OpenLatchResult]

    _ImplementationCls: Type[OpenLatchImpl] = OpenLatchImpl


class OpenLatchCreate(BaseCommandCreate[OpenLatchParams]):
    """A request to create a Heater-Shaker's open latch command."""

    commandType: OpenLatchCommandType
    params: OpenLatchParams

    _CommandCls: Type[OpenLatch] = OpenLatch
