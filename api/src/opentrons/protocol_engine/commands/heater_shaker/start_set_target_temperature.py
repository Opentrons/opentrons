"""Command models to start heating a Heater-Shaker Module."""
from typing import Optional
from typing_extensions import Literal, Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate


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

    def __init__(self, **kwargs: object) -> None:
        pass

    async def execute(
        self,
        params: StartSetTargetTemperatureParams,
    ) -> StartSetTargetTemperatureResult:
        """Set a Heater-Shaker's target temperature."""
        raise NotImplementedError(
            "Heater-Shaker start set target temperature not yet implemented."
        )


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
