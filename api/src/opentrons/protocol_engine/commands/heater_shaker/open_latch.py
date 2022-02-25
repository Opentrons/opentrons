"""Command models to open the Heater-Shaker Module's latch."""
from typing import Optional
from typing_extensions import Literal, Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate


OpenLatchCommandType = Literal["heaterShakerModule/openLatch"]


class OpenLatchParams(BaseModel):
    """Input parameters to open a Heater-Shaker Module's latch."""

    moduleId: str = Field(..., description="Unique ID of the Heater-Shaker Module.")


class OpenLatchResult(BaseModel):
    """Result data from opening a Heater-Shaker's latch."""


class OpenLatchImpl(AbstractCommandImpl[OpenLatchParams, OpenLatchResult]):
    """Execution implementation of a Heater-Shaker's open latch command."""

    async def execute(self, params: OpenLatchParams) -> OpenLatchResult:
        """Open a Heater-Shaker's latch."""
        raise NotImplementedError("Heater-Shaker open latch not yet implemented.")


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
