"""Move to well command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel
from typing import Optional, Type
from typing_extensions import Literal

from .pipetting_common import BasePipettingParams
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate


MoveToWellCommandType = Literal["moveToWell"]


class MoveToWellParams(BasePipettingParams):
    """Payload required to move a pipette to a specific well."""

    pass


class MoveToWellResult(BaseModel):
    """Result data from the execution of a MoveToWell command."""

    pass


class MoveToWellImplementation(AbstractCommandImpl[MoveToWellParams, MoveToWellResult]):
    """Move to well command implementation."""

    async def execute(self, params: MoveToWellParams) -> MoveToWellResult:
        """Move the requested pipette to the requested well."""
        await self._movement.move_to_well(
            pipette_id=params.pipetteId,
            labware_id=params.labwareId,
            well_name=params.wellName,
            well_location=params.wellLocation,
        )

        return MoveToWellResult()


class MoveToWell(BaseCommand[MoveToWellParams, MoveToWellResult]):
    """Move to well command model."""

    commandType: MoveToWellCommandType = "moveToWell"
    params: MoveToWellParams
    result: Optional[MoveToWellResult]

    _ImplementationCls: Type[MoveToWellImplementation] = MoveToWellImplementation


class MoveToWellCreate(BaseCommandCreate[MoveToWellParams]):
    """Move to well command creation request model."""

    commandType: MoveToWellCommandType = "moveToWell"
    params: MoveToWellParams

    _CommandCls: Type[MoveToWell] = MoveToWell
