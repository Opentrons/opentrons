"""Command models to start heating a Heater-Shaker Module."""
from __future__ import annotations
from typing import Optional, TYPE_CHECKING
from typing_extensions import Literal, Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate
from opentrons.hardware_control.modules import HeaterShaker
from opentrons.hardware_control import HardwareControlAPI

if TYPE_CHECKING:
    from opentrons.protocol_engine.state import StateView

StartSetTargetTemperatureCommandType = Literal[
    "heaterShakerModule/startSetTargetTemperature"
]


class StartSetTargetTemperatureParams(BaseModel):
    """Input parameters to set a Heater-Shaker's target temperature."""

    moduleId: str = Field(..., description="Unique ID of the Heater-Shaker Module.")
    temperature: float = Field(..., description="Target temperature in °C.")


class StartSetTargetTemperatureResult(BaseModel):
    """Result data from setting a Heater-Shaker's target temperature."""


class StartSetTargetTemperatureImpl(
    AbstractCommandImpl[
        StartSetTargetTemperatureParams, StartSetTargetTemperatureResult
    ]
):
    """Execution implementation of a Heater-Shaker's set temperature command."""

    def __init__(
            self,
            state_view: StateView,
            hardware_api: HardwareControlAPI,
            **unused_dependencies: object
    ) -> None:
        self._state_view = state_view
        self._hardware_api = hardware_api

    async def execute(
        self,
        params: StartSetTargetTemperatureParams,
    ) -> StartSetTargetTemperatureResult:
        """Set a Heater-Shaker's target temperature."""
        await self._set_target_temperature(
            module_id=params.moduleId,
            celsius=params.temperature,
        )
        return StartSetTargetTemperatureResult()

    async def _set_target_temperature(self, module_id: str, celsius: float) -> None:
        """Set target temperature and return immediately."""
        model = self._state_view.modules.get_model(module_id)
        assert self._state_view.modules.is_target_temperature_valid(
            heating_module_model=model,
            celsius=celsius
        )
        hardware_module = self._state_view.modules.find_loaded_hardware_module(
            module_id=module_id,
            attached_modules=self._hardware_api.attached_modules,
            expected_type=HeaterShaker,
        )
        await hardware_module.start_set_temperature(celsius)


class StartSetTargetTemperature(
    BaseCommand[StartSetTargetTemperatureParams, StartSetTargetTemperatureResult]
):
    """A command to set a Heater-Shaker's target temperature."""

    commandType: StartSetTargetTemperatureCommandType = (
        "heaterShakerModule/startSetTargetTemperature"
    )
    params: StartSetTargetTemperatureParams
    result: Optional[StartSetTargetTemperatureResult]

    _ImplementationCls: Type[
        StartSetTargetTemperatureImpl
    ] = StartSetTargetTemperatureImpl


class StartSetTargetTemperatureCreate(
    BaseCommandCreate[StartSetTargetTemperatureParams]
):
    """A request to create a Heater-Shaker's set temperature command."""

    commandType: StartSetTargetTemperatureCommandType
    params: StartSetTargetTemperatureParams

    _CommandCls: Type[StartSetTargetTemperature] = StartSetTargetTemperature
