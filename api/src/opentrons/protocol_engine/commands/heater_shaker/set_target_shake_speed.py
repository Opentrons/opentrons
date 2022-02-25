"""Command models to shake the Heater Shaker Module."""
from typing import Optional
from typing_extensions import Literal, Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate


SetTargetShakeSpeedCommandType = Literal["heaterShakerModule/setTargetShakeSpeed"]


class SetTargetShakeSpeedParams(BaseModel):
    """Input parameters to start shaking a Heater Shaker Module."""

    moduleId: str = Field(..., description="Unique ID of the Heater Shaker Module.")
    # TODO(mc, 2022-02-24): for set temperature we use `temperature` (not `celsius`)
    # but for shake we use `rpm` (not `speed`). This is inconsistent
    rpm: int = Field(..., description="Target speed in rotations per minute.")


class SetTargetShakeSpeedResult(BaseModel):
    """Result data from setting a Heater Shaker's shake speed."""


class SetTargetShakeSpeedImpl(
    AbstractCommandImpl[SetTargetShakeSpeedParams, SetTargetShakeSpeedResult]
):
    """Execution implementation of a Heater Shaker's shake command."""

    async def execute(
        self,
        params: SetTargetShakeSpeedParams,
    ) -> SetTargetShakeSpeedResult:
        """Set a Heater Shaker's target shake speed."""
        raise NotImplementedError("Heater Shaker set shake speed not yet implemented.")


class SetTargetShakeSpeed(
    BaseCommand[SetTargetShakeSpeedParams, SetTargetShakeSpeedResult]
):
    """A command to set a Heater Shaker's shake speed."""

    commandType: SetTargetShakeSpeedCommandType = (
        "heaterShakerModule/setTargetShakeSpeed"
    )
    params: SetTargetShakeSpeedParams
    result: Optional[SetTargetShakeSpeedResult]

    _ImplementationCls: Type[SetTargetShakeSpeedImpl] = SetTargetShakeSpeedImpl


class SetTargetShakeSpeedCreate(BaseCommandCreate[SetTargetShakeSpeedParams]):
    """A request to create a Heater Shaker's set shake speed command."""

    commandType: SetTargetShakeSpeedCommandType
    params: SetTargetShakeSpeedParams

    _CommandCls: Type[SetTargetShakeSpeed] = SetTargetShakeSpeed
