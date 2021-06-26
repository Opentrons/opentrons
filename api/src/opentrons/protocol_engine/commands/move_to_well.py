"""Move to well command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel
from typing import Optional, Type
from typing_extensions import Literal

from .pipetting_common import BasePipettingData
from .command import AbstractCommandImpl, BaseCommand, BaseCommandRequest


MoveToWellCommandType = Literal["moveToWell"]


class MoveToWellData(BasePipettingData):
    """Data required to move a pipette to a specific well."""

    pass


class MoveToWellResult(BaseModel):
    """Result data from the execution of a MoveToWell command."""

    pass


class MoveToWellImplementation(AbstractCommandImpl[MoveToWellData, MoveToWellResult]):
    """Move to well command implementation."""

    async def execute(self, data: MoveToWellData) -> MoveToWellResult:
        """Move the requested pipette to the requested well."""
        await self._movement.move_to_well(
            pipette_id=data.pipetteId,
            labware_id=data.labwareId,
            well_name=data.wellName,
        )

        return MoveToWellResult()


class MoveToWell(BaseCommand[MoveToWellData, MoveToWellResult]):
    """Move to well command model."""

    commandType: MoveToWellCommandType = "moveToWell"
    data: MoveToWellData
    result: Optional[MoveToWellResult]

    _ImplementationCls: Type[MoveToWellImplementation] = MoveToWellImplementation


class MoveToWellRequest(BaseCommandRequest[MoveToWellData]):
    """Move to well command creation request model."""

    commandType: MoveToWellCommandType = "moveToWell"
    data: MoveToWellData

    _CommandCls: Type[MoveToWell] = MoveToWell
