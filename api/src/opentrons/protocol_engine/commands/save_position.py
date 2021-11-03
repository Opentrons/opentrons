"""Save pipette position command request, result, and implementation models."""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional, Type
from typing_extensions import Literal

from ..types import DeckPoint
from .command import AbstractCommandImpl, BaseCommand, BaseCommandRequest

SavePositionCommandType = Literal["savePosition"]


class SavePositionData(BaseModel):
    """Data needed to save a pipette's current position."""

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
    AbstractCommandImpl[SavePositionData, SavePositionResult]
):
    """Save position command implementation."""

    async def execute(self, data: SavePositionData) -> SavePositionResult:
        """Check the requested pipette's current position."""
        result = await self._movement.save_position(
            pipette_id=data.pipetteId, position_id=data.positionId
        )
        return SavePositionResult(
            positionId=result.positionId, position=result.position
        )


class SavePosition(BaseCommand[SavePositionData, SavePositionResult]):
    """Save Position command model."""

    commandType: SavePositionCommandType = "savePosition"
    data: SavePositionData
    result: Optional[SavePositionResult]

    _ImplementationCls: Type[SavePositionImplementation] = SavePositionImplementation


class SavePositionRequest(BaseCommandRequest[SavePositionData]):
    """Save position command creation request model."""

    commandType: SavePositionCommandType = "savePosition"
    data: SavePositionData

    _CommandCls: Type[SavePosition] = SavePosition
