"""Command models to await a Heater-Shaker Module's target temperature."""
from __future__ import annotations
from typing import Optional, TYPE_CHECKING
from typing_extensions import Literal, Type

from pydantic import BaseModel, Field

from opentrons.hardware_control import HardwareControlAPI
from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate
from opentrons.protocol_engine.errors import NoTargetTemperatureSetError


if TYPE_CHECKING:
    from opentrons.protocol_engine.state import StateView

AwaitTemperatureCommandType = Literal["heaterShakerModule/awaitTemperature"]


class AwaitTemperatureParams(BaseModel):
    """Input parameters to await a Heater-Shaker's target temperature."""

    moduleId: str = Field(..., description="Unique ID of the Heater-Shaker Module.")


class AwaitTemperatureResult(BaseModel):
    """Result data from awaiting a Heater-Shaker's target temperature."""


class AwaitTemperatureImpl(
    AbstractCommandImpl[AwaitTemperatureParams, AwaitTemperatureResult]
):
    """Execution implementation of a Heater-Shaker's await temperature command."""

    def __init__(
        self,
        state_view: StateView,
        hardware_api: HardwareControlAPI,
        **unused_dependencies: object,
    ) -> None:
        self._state_view = state_view
        self._hardware_api = hardware_api

    async def execute(self, params: AwaitTemperatureParams) -> AwaitTemperatureResult:
        """Wait for a Heater-Shaker's target temperature to be reached."""
        hs_module_view = self._state_view.modules.get_heater_shaker_module_view(
            module_id=params.moduleId
        )
        if not hs_module_view.parent_module_view.is_target_temperature_set(
            module_id=params.moduleId
        ):
            raise NoTargetTemperatureSetError("No target temperature to wait for.")

        hs_hardware_module = hs_module_view.find_hardware(
            attached_modules=self._hardware_api.attached_modules
        )
        if hs_hardware_module is not None:
            await hs_hardware_module.await_temperature()
        return AwaitTemperatureResult()


class AwaitTemperature(BaseCommand[AwaitTemperatureParams, AwaitTemperatureResult]):
    """A command to wait for a Heater-Shaker's target temperature to be reached."""

    commandType: AwaitTemperatureCommandType = "heaterShakerModule/awaitTemperature"
    params: AwaitTemperatureParams
    result: Optional[AwaitTemperatureResult]

    _ImplementationCls: Type[AwaitTemperatureImpl] = AwaitTemperatureImpl


class AwaitTemperatureCreate(BaseCommandCreate[AwaitTemperatureParams]):
    """A request to create a Heater-Shaker's await temperature command."""

    commandType: AwaitTemperatureCommandType
    params: AwaitTemperatureParams

    _CommandCls: Type[AwaitTemperature] = AwaitTemperature
