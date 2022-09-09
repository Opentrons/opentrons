"""Move to coordinates command request, result, and implementation models."""
from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional, Type, TYPE_CHECKING
from typing_extensions import Literal

from ..types import DeckPoint
from .pipetting_common import PipetteIdMixin
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from ..execution import MovementHandler


MoveToCoordinatesCommandType = Literal["moveToCoordinates"]


class MoveToCoordinatesParams(PipetteIdMixin):
    """Payload required to move a pipette to coordinates."""

    coordinates: DeckPoint = Field(
        ...,
        description="X, Y and Z coordinates in mm from deck's origin location (left-front-bottom corner of work space)",
    )

    minimumZHeight: Optional[float] = Field(
        None,
        description=(
            "Optional minimal Z margin in mm."
            " If this is larger than the API's default safe Z margin,"
            " it will make the arc higher. If it's smaller, it will have no effect."
            " Specifying this for movements that would not arc"
            " (moving within the same well in the same labware)"
            " will cause an arc movement instead."
        ),
    )

    forceDirect: bool = Field(
        False,
        description=(
            "If true, moving from one labware/well to another"
            " will not arc to the default safe z,"
            " but instead will move directly to the specified location."
            " This will also force the `minimumZHeight` param to be ignored."
            " A 'direct' movement is in X/Y/Z simultaneously."
        ),
    )


class MoveToCoordinatesResult(BaseModel):
    """Result data from the execution of a MoveToCoordinates command."""

    pass


class MoveToCoordinatesImplementation(
    AbstractCommandImpl[MoveToCoordinatesParams, MoveToCoordinatesResult]
):
    """Move to coordinates command implementation."""

    def __init__(
        self,
        movement: MovementHandler,
        **kwargs: object,
    ) -> None:
        self._movement = movement

    async def execute(self, params: MoveToCoordinatesParams) -> MoveToCoordinatesResult:
        """Move the requested pipette to the requested coordinates."""
        await self._movement.move_to_coordinates(
            pipette_id=params.pipetteId,
            deck_coordinates=params.coordinates,
            direct=params.forceDirect,
            additional_min_travel_z=params.minimumZHeight,
        )
        return MoveToCoordinatesResult()


class MoveToCoordinates(BaseCommand[MoveToCoordinatesParams, MoveToCoordinatesResult]):
    """Move to well command model."""

    commandType: MoveToCoordinatesCommandType = "moveToCoordinates"
    params: MoveToCoordinatesParams
    result: Optional[MoveToCoordinatesResult]

    _ImplementationCls: Type[
        MoveToCoordinatesImplementation
    ] = MoveToCoordinatesImplementation


class MoveToCoordinatesCreate(BaseCommandCreate[MoveToCoordinatesParams]):
    """Move to coordinates command creation request model."""

    commandType: MoveToCoordinatesCommandType = "moveToCoordinates"
    params: MoveToCoordinatesParams

    _CommandCls: Type[MoveToCoordinates] = MoveToCoordinates
