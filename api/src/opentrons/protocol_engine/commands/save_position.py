"""Save pipette position command request, result, and implementation models."""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from ..types import DeckPoint
from ..resources import ModelUtils
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ..errors.error_occurrence import ErrorOccurrence

if TYPE_CHECKING:
    from ..execution import GantryMover

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
    failOnNotHomed: Optional[bool] = Field(
        True, descrption="Require all axes to be homed before saving position."
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
    AbstractCommandImpl[SavePositionParams, SuccessData[SavePositionResult, None]]
):
    """Save position command implementation."""

    def __init__(
        self,
        gantry_mover: GantryMover,
        model_utils: ModelUtils,
        **kwargs: object,
    ) -> None:
        self._gantry_mover = gantry_mover
        self._model_utils = model_utils

    async def execute(
        self, params: SavePositionParams
    ) -> SuccessData[SavePositionResult, None]:
        """Check the requested pipette's current position."""
        position_id = self._model_utils.ensure_id(params.positionId)
        fail_on_not_homed = (
            params.failOnNotHomed if params.failOnNotHomed is not None else True
        )
        x, y, z = await self._gantry_mover.get_position(
            pipette_id=params.pipetteId, fail_on_not_homed=fail_on_not_homed
        )

        return SuccessData(
            public=SavePositionResult(
                positionId=position_id,
                position=DeckPoint(x=x, y=y, z=z),
            ),
            private=None,
        )


class SavePosition(
    BaseCommand[SavePositionParams, SavePositionResult, ErrorOccurrence]
):
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
