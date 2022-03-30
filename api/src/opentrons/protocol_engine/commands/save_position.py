"""Save pipette position command request, result, and implementation models."""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from ..types import DeckPoint
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from ..execution import MovementHandler

SavePositionCommandType = Literal["savePosition"]


class SavePositionParams(BaseModel):
    """Payload needed to save a pipette's current position."""

    pipetteId: str = Field(
        ..., description="Unique identifier of the pipette in question."
    )
    positionId: Optional[str] = Field(
        None,
        description="An optional ID to assign to this command instance. "
        "Auto-assigned if not defined.",
    )


class SavePositionResult(BaseModel):
    """Result data from executing a savePosition."""

    positionId: str = Field(
        ..., description="An ID to reference this position in subsequent requests."
    )
    position: DeckPoint = Field(
        ...,
        description="The (x,y,z) coordinates of the pipette's critical point "
        "in deck space.",
    )


class SavePositionImplementation(
    AbstractCommandImpl[SavePositionParams, SavePositionResult]
):
    """Save position command implementation."""

    def __init__(self, movement: MovementHandler, **kwargs: object) -> None:
        self._movement = movement

    async def execute(self, params: SavePositionParams) -> SavePositionResult:
        """Check the requested pipette's current position."""
        result = await self._movement.save_position(
            pipette_id=params.pipetteId,
            position_id=params.positionId,
        )
        return SavePositionResult(
            positionId=result.positionId,
            position=result.position,
        )


class SavePosition(BaseCommand[SavePositionParams, SavePositionResult]):
    """Save Position command model."""

    commandType: SavePositionCommandType = "savePosition"
    params: SavePositionParams
    result: Optional[SavePositionResult]

    _ImplementationCls: Type[SavePositionImplementation] = SavePositionImplementation


class SavePositionCreate(BaseCommandCreate[SavePositionParams]):
    """Save position command creation request model."""

    commandType: SavePositionCommandType = "savePosition"
    params: SavePositionParams

    _CommandCls: Type[SavePosition] = SavePosition
