"""Command models to close the Heater-Shaker Module's latch."""
from typing import Optional
from typing_extensions import Literal, Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate


CloseLatchCommandType = Literal["heaterShakerModule/closeLatch"]


class CloseLatchParams(BaseModel):
    """Input parameters to close a Heater-Shaker Module's latch."""

    moduleId: str = Field(..., description="Unique ID of the Heater-Shaker Module.")


class CloseLatchResult(BaseModel):
    """Result data from closing a Heater-Shaker's latch."""


class CloseLatchImpl(AbstractCommandImpl[CloseLatchParams, CloseLatchResult]):
    """Execution implementation of a Heater-Shaker's close latch command."""

    async def execute(self, params: CloseLatchParams) -> CloseLatchResult:
        """Close a Heater-Shaker's latch."""
        raise NotImplementedError("Heater-Shaker close latch not yet implemented.")


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
