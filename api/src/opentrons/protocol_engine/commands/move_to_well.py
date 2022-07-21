"""Move to well command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from .pipetting_common import PipetteIdMixin, WellLocationMixin
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from ..execution import MovementHandler

MoveToWellCommandType = Literal["moveToWell"]


class MoveToWellParams(PipetteIdMixin, WellLocationMixin):
    """Payload required to move a pipette to a specific well."""

    pass


class MoveToWellResult(BaseModel):
    """Result data from the execution of a MoveToWell command."""

    pass


class MoveToWellImplementation(AbstractCommandImpl[MoveToWellParams, MoveToWellResult]):
    """Move to well command implementation."""

    def __init__(self, movement: MovementHandler, **kwargs: object) -> None:
        self._movement = movement

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
