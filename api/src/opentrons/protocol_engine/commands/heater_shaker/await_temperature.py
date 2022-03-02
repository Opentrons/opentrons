"""Command models to await a Heater-Shaker Module's target temperature."""
from typing import Optional
from typing_extensions import Literal, Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate


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

    def __init__(self, **kwargs: object) -> None:
        pass

    async def execute(self, params: AwaitTemperatureParams) -> AwaitTemperatureResult:
        """Wait for a Heater-Shaker's target temperature to be reached."""
        raise NotImplementedError(
            "Heater-Shaker await temperature not yet implemented."
        )


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
