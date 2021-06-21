"""Move to well command request, result, and implementation models."""
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


MoveToWellCommandType = Literal["moveToWell"]


class MoveToWellData(BasePipettingData):
    """Data required to move a pipette to a specific well."""

    pass


class MoveToWellResult(BaseModel):
    """Result data from the execution of a MoveToWell command."""

    pass


class MoveToWellImplProvider:
    """Implementation provider mixin."""

    data: MoveToWellData

    def get_implementation(self) -> MoveToWellImplementation:
        """Get the execution implementation of a MoveToWell."""
        return MoveToWellImplementation(self.data)


class MoveToWellRequest(BaseCommandRequest[MoveToWellData], MoveToWellImplProvider):
    """Move to well command creation request model."""

    commandType: MoveToWellCommandType = "moveToWell"
    data: MoveToWellData


class MoveToWell(BaseCommand[MoveToWellData, MoveToWellResult], MoveToWellImplProvider):
    """Move to well command model."""

    commandType: MoveToWellCommandType = "moveToWell"
    data: MoveToWellData
    result: Optional[MoveToWellResult]


class MoveToWellImplementation(
    AbstractCommandImpl[MoveToWellData, MoveToWellResult, MoveToWell]
):
    """Move to well command implementation."""

    def create_command(
        self,
        command_id: str,
        created_at: datetime,
        status: CommandStatus = CommandStatus.QUEUED,
    ) -> MoveToWell:
        """Create a new MoveToWell command resource."""
        return MoveToWell(
            id=command_id,
            createdAt=created_at,
            status=status,
            data=self._data,
        )

    async def execute(self, handlers: CommandHandlers) -> MoveToWellResult:
        """Move the requested pipette to the requested well."""
        await handlers.movement.move_to_well(
            pipette_id=self._data.pipetteId,
            labware_id=self._data.labwareId,
            well_name=self._data.wellName,
        )

        return MoveToWellResult()
