"""Drop tip command request, result, and implementation models."""
from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from typing_extensions import Literal

from .pipetting_common import BasePipettingData
from .command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandRequest,
    CommandHandlers,
    CommandStatus,
)

DropTipCommandType = Literal["dropTip"]


class DropTipData(BasePipettingData):
    """A request to drop a tip in a specific well."""

    pass


class DropTipResult(BaseModel):
    """Result data from the execution of a DropTipRequest."""

    pass


class DropTipImplProvider:
    """Implementation provider mixin."""

    data: DropTipData

    def get_implementation(self) -> DropTipImplementation:
        """Get the execution implementation of a DropTip."""
        return DropTipImplementation(self.data)


class DropTipRequest(BaseCommandRequest[DropTipData], DropTipImplProvider):
    """Drop tip command creation request model."""

    commandType: DropTipCommandType = "dropTip"
    data: DropTipData


class DropTip(BaseCommand[DropTipData, DropTipResult], DropTipImplProvider):
    """Drop tip command model."""

    commandType: DropTipCommandType = "dropTip"
    data: DropTipData
    result: Optional[DropTipResult]


class DropTipImplementation(AbstractCommandImpl[DropTipData, DropTipResult, DropTip]):
    """Drop tip command implementation."""

    def create_command(
        self,
        command_id: str,
        created_at: datetime,
        status: CommandStatus = CommandStatus.QUEUED,
    ) -> DropTip:
        """Create a new Dispense command resource."""
        return DropTip(
            id=command_id,
            createdAt=created_at,
            status=status,
            data=self._data,
        )

    async def execute(
        self,
        handlers: CommandHandlers,
    ) -> DropTipResult:
        """Move to and drop a tip using the requested pipette."""
        await handlers.pipetting.drop_tip(
            pipette_id=self._data.pipetteId,
            labware_id=self._data.labwareId,
            well_name=self._data.wellName,
        )

        return DropTipResult()
