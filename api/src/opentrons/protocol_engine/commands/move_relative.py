"""Move relative (jog) command payload, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from ..types import MovementAxis, DeckPoint
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ..errors.error_occurrence import ErrorOccurrence
from .pipetting_common import DestinationPositionResult

if TYPE_CHECKING:
    from ..execution import MovementHandler


MoveRelativeCommandType = Literal["moveRelative"]


class MoveRelativeParams(BaseModel):
    """Payload required for a MoveRelative command."""

    pipetteId: str = Field(..., description="Pipette to move.")
    axis: MovementAxis = Field(..., description="Axis along which to move.")
    distance: float = Field(
        ...,
        description=(
            "Distance to move in millimeters. A positive number will move"
            " towards the right (x), back (y), top (z) of the deck."
        ),
    )


class MoveRelativeResult(DestinationPositionResult):
    """Result data from the execution of a MoveRelative command."""

    pass


class MoveRelativeImplementation(
    AbstractCommandImpl[MoveRelativeParams, SuccessData[MoveRelativeResult, None]]
):
    """Move relative command implementation."""

    def __init__(self, movement: MovementHandler, **kwargs: object) -> None:
        self._movement = movement

    async def execute(
        self, params: MoveRelativeParams
    ) -> SuccessData[MoveRelativeResult, None]:
        """Move (jog) a given pipette a relative distance."""
        x, y, z = await self._movement.move_relative(
            pipette_id=params.pipetteId,
            axis=params.axis,
            distance=params.distance,
        )

        return SuccessData(
            public=MoveRelativeResult(position=DeckPoint(x=x, y=y, z=z)), private=None
        )


class MoveRelative(
    BaseCommand[MoveRelativeParams, MoveRelativeResult, ErrorOccurrence]
):
    """Command to move (jog) a given pipette a relative distance."""

    commandType: MoveRelativeCommandType = "moveRelative"
    params: MoveRelativeParams
    result: Optional[MoveRelativeResult]

    _ImplementationCls: Type[MoveRelativeImplementation] = MoveRelativeImplementation


class MoveRelativeCreate(BaseCommandCreate[MoveRelativeParams]):
    """Data to create a MoveRelative command."""

    commandType: MoveRelativeCommandType = "moveRelative"
    params: MoveRelativeParams

    _CommandCls: Type[MoveRelative] = MoveRelative
