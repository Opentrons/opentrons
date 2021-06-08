"""Move to well command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel
from typing import TYPE_CHECKING, Optional
from typing_extensions import Literal

from .base import BaseCommand, BaseCommandRequest, BaseCommandImpl
from .pipetting_common import BasePipettingData


if TYPE_CHECKING:
    from opentrons.protocol_engine.execution import CommandHandlers


MoveToWellCommandType = Literal["moveToWell"]


class MoveToWellData(BasePipettingData):
    """Data required to move a pipette to a specific well."""

    pass


class MoveToWellResult(BaseModel):
    """Result data from the execution of a MoveToWell command."""

    pass


class MoveToWellRequest(BaseCommandRequest[MoveToWellData]):
    """Move to well command creation request model."""

    commandType: MoveToWellCommandType = "moveToWell"
    data: MoveToWellData


class MoveToWell(BaseCommand[MoveToWellData, MoveToWellResult]):
    """Move to well command model."""

    commandType: MoveToWellCommandType = "moveToWell"
    data: MoveToWellData
    result: Optional[MoveToWellResult]

    class Implementation(BaseCommandImpl[MoveToWellData, MoveToWellResult]):
        """Move to well command implementation."""

        async def execute(
            self,
            data: MoveToWellData,
            handlers: CommandHandlers,
        ) -> MoveToWellResult:
            """Move the requested pipette to the requested well."""
            await handlers.movement.move_to_well(
                pipette_id=data.pipetteId,
                labware_id=data.labwareId,
                well_name=data.wellName,
            )

            return MoveToWellResult()
