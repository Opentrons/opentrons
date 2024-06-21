"""Move to well command request, result, and implementation models."""
from __future__ import annotations
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from ..types import DeckPoint
from .pipetting_common import (
    PipetteIdMixin,
    WellLocationMixin,
    MovementMixin,
    DestinationPositionResult,
)
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ..errors.error_occurrence import ErrorOccurrence

if TYPE_CHECKING:
    from ..execution import MovementHandler

MoveToWellCommandType = Literal["moveToWell"]


class MoveToWellParams(PipetteIdMixin, WellLocationMixin, MovementMixin):
    """Payload required to move a pipette to a specific well."""

    pass


class MoveToWellResult(DestinationPositionResult):
    """Result data from the execution of a MoveToWell command."""

    pass


class MoveToWellImplementation(
    AbstractCommandImpl[MoveToWellParams, SuccessData[MoveToWellResult, None]]
):
    """Move to well command implementation."""

    def __init__(self, movement: MovementHandler, **kwargs: object) -> None:
        self._movement = movement

    async def execute(
        self, params: MoveToWellParams
    ) -> SuccessData[MoveToWellResult, None]:
        """Move the requested pipette to the requested well."""
        x, y, z = await self._movement.move_to_well(
            pipette_id=params.pipetteId,
            labware_id=params.labwareId,
            well_name=params.wellName,
            well_location=params.wellLocation,
            force_direct=params.forceDirect,
            minimum_z_height=params.minimumZHeight,
            speed=params.speed,
        )

        return SuccessData(
            public=MoveToWellResult(position=DeckPoint(x=x, y=y, z=z)), private=None
        )


class MoveToWell(BaseCommand[MoveToWellParams, MoveToWellResult, ErrorOccurrence]):
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
