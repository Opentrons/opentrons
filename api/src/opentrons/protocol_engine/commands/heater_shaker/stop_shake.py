"""Command models to stop shaking the Heater-Shaker Module."""
from typing import Optional
from typing_extensions import Literal, Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate


StopShakeCommandType = Literal["heaterShakerModule/stopShake"]


class StopShakeParams(BaseModel):
    """Input parameters to stop shaking a Heater-Shaker Module."""

    moduleId: str = Field(..., description="Unique ID of the Heater-Shaker Module.")


class StopShakeResult(BaseModel):
    """Result data from stopping a Heater-Shaker's shake."""


class StopShakeImpl(AbstractCommandImpl[StopShakeParams, StopShakeResult]):
    """Execution implementation of a Heater-Shaker's stop shake command."""

    async def execute(self, params: StopShakeParams) -> StopShakeResult:
        """Stop a Heater-Shaker's shake."""
        raise NotImplementedError("Heater-Shaker stop shake not yet implemented.")


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
