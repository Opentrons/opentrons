"""Command models to start heating a Heater-Shaker Module."""
from __future__ import annotations
from typing import Optional, TYPE_CHECKING
from typing_extensions import Literal, Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from opentrons.protocol_engine.state import StateView
    from opentrons.protocol_engine.execution import EquipmentHandler


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
        equipment: EquipmentHandler,
        **unused_dependencies: object,
    ) -> None:
        self._state_view = state_view
        self._equipment = equipment

    async def execute(
        self,
        params: StartSetTargetTemperatureParams,
    ) -> StartSetTargetTemperatureResult:
        """Set a Heater-Shaker's target temperature."""
        # Allow propagation of ModuleNotLoadedError and WrongModuleTypeError.
        hs_module_substate = self._state_view.modules.get_heater_shaker_module_substate(
            module_id=params.moduleId
        )

        # Verify temperature from hs module view
        validated_temp = hs_module_substate.validate_target_temperature(
            params.temperature
        )

        # Allow propagation of ModuleNotAttachedError.
        hs_hardware_module = self._equipment.get_module_hardware_api(
            hs_module_substate.module_id
        )

        if hs_hardware_module is not None:
            await hs_hardware_module.start_set_temperature(validated_temp)

        return StartSetTargetTemperatureResult()


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
