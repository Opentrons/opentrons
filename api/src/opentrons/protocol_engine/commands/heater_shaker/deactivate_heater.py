"""Command models to stop heating Heater-Shaker Module."""
from __future__ import annotations
from typing import Optional, TYPE_CHECKING
from typing_extensions import Literal, Type

from pydantic import BaseModel, Field

from opentrons.hardware_control import HardwareControlAPI
from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from opentrons.protocol_engine.state import StateView


DeactivateHeaterCommandType = Literal["heaterShakerModule/deactivateHeater"]


class DeactivateHeaterParams(BaseModel):
    """Input parameters to unset a Heater-Shaker's target temperature."""

    moduleId: str = Field(..., description="Unique ID of the Heater-Shaker Module.")


class DeactivateHeaterResult(BaseModel):
    """Result data from unsetting a Heater-Shaker's target temperature."""


class DeactivateHeaterImpl(
    AbstractCommandImpl[DeactivateHeaterParams, DeactivateHeaterResult]
):
    """Execution implementation of a Heater-Shaker's deactivate heater command."""

    def __init__(
        self,
        state_view: StateView,
        hardware_api: HardwareControlAPI,
        **unused_dependencies: object,
    ) -> None:
        self._state_view = state_view
        self._hardware_api = hardware_api

    async def execute(self, params: DeactivateHeaterParams) -> DeactivateHeaterResult:
        """Unset a Heater-Shaker's target temperature."""
        hs_module_view = self._state_view.modules.get_heater_shaker_module_view(
            module_id=params.moduleId
        )
        hs_hardware_module = hs_module_view.find_hardware(
            attached_modules=self._hardware_api.attached_modules
        )
        if hs_hardware_module is not None:
            await hs_hardware_module.set_temperature(celsius=0)
        return DeactivateHeaterResult()


class DeactivateHeater(BaseCommand[DeactivateHeaterParams, DeactivateHeaterResult]):
    """A command to unset a Heater-Shaker's target temperature."""

    commandType: DeactivateHeaterCommandType = "heaterShakerModule/deactivateHeater"
    params: DeactivateHeaterParams
    result: Optional[DeactivateHeaterResult]

    _ImplementationCls: Type[DeactivateHeaterImpl] = DeactivateHeaterImpl


class DeactivateHeaterCreate(BaseCommandCreate[DeactivateHeaterParams]):
    """A request to create a Heater-Shaker's deactivate heater command."""

    commandType: DeactivateHeaterCommandType
    params: DeactivateHeaterParams

    _CommandCls: Type[DeactivateHeater] = DeactivateHeater
