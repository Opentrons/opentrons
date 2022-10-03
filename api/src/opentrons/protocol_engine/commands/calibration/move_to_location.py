"""Calibration Move To Location command payload, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import TYPE_CHECKING, Type, Optional
from typing_extensions import Literal
from enum import Enum

from opentrons.protocol_engine.commands.pipetting_common import PipetteIdMixin
from opentrons.protocol_engine.types import DeckPoint
from opentrons.types import DeckSlotName
from opentrons.protocol_engine.commands.command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
)
<<<<<<< HEAD
=======
from opentrons.protocol_engine.types import DeckPoint
>>>>>>> 055e07927 (removed extended enum)

if TYPE_CHECKING:
    from opentrons.protocol_engine.execution import MovementHandler
    from opentrons.protocol_engine.state.state import StateView


MoveToLocationCommandType = Literal["calibration/moveToLocation"]


<<<<<<< HEAD
class CalibrationPositions(str, Enum):
    """Deck slot to move to."""

    probePosition = "probePosition"
    attachOrDetach = "attachOrDetach"

    @property
    def offset(self) -> DeckPoint:
        """Return offset values for the given position."""
        if self.value == "probePosition":
            return DeckPoint(x=10, y=0, z=3)
        else:
            return DeckPoint(x=0, y=0, z=0)
=======
class CalibrationPositions(Enum):
    """Deck slot to move to."""

    probe_position = 5
    attach_or_detach = 2

    @property
    def location(self) -> DeckPoint:
        """Assign location value to CalibrationPositions with a 3mm safety margin."""
        if self.value == 5:
            return DeckPoint(x=float(145), y=float(107), z=float(3))
        elif self.value == 2:
            return DeckPoint(x=float(145), y=float(0), z=float(3))
        else:
            return DeckPoint(x=float(0), y=float(0), z=float(3))
>>>>>>> 055e07927 (removed extended enum)


class MoveToLocationParams(PipetteIdMixin):
    """Calibration set up position command parameters."""

<<<<<<< HEAD
    deckSlot: CalibrationPositions = Field(
        ...,
=======
    deck_slot: CalibrationPositions = Field(
        CalibrationPositions.probe_position,
>>>>>>> 055e07927 (removed extended enum)
        description="Slot location to move to before starting calibration.",
    )


class MoveToLocationResult(BaseModel):
    """Result data from the execution of a CalibrationSetUpPosition command."""

    position: DeckPoint = Field(
        ..., description="Deck Point position after the move command has been executed"
    )
    positionId: str = Field(..., description="Deck Point position id")


class MoveToLocationImplementation(
    AbstractCommandImpl[MoveToLocationParams, MoveToLocationResult]
):
    """Calibration set up position command implementation."""

    def __init__(
        self, movement: MovementHandler, state_view: StateView, **kwargs: object
    ) -> None:
        self._movement = movement
        self._state_view = state_view

    async def execute(self, params: MoveToLocationParams) -> MoveToLocationResult:
        """Move the requested pipette to a given deck slot."""
<<<<<<< HEAD
        offset = params.deckSlot.offset
        if params.deckSlot == CalibrationPositions.probePosition:
            deck_center = self._state_view.labware.get_slot_center_position(
                DeckSlotName.SLOT_5
            )
            z_position = offset.z
        else:
            deck_center = self._state_view.labware.get_slot_center_position(
                DeckSlotName.SLOT_2
            )
            current_position = await self._movement.save_position(
                pipette_id=params.pipetteId, position_id="slot 2"
            )
            z_position = current_position.position.z
        destination = DeckPoint(
            x=deck_center.x + offset.x, y=deck_center.y + offset.y, z=z_position
        )

        await self._movement.move_to_coordinates(
            pipette_id=params.pipetteId,
            deck_coordinates=destination,
=======
        await self._movement.move_to_coordinates(
            pipette_id=params.pipetteId,
            deck_coordinates=params.deck_slot.location,
>>>>>>> 055e07927 (removed extended enum)
            direct=True,
            additional_min_travel_z=None,
        )

        new_position = await self._movement.save_position(
<<<<<<< HEAD
            pipette_id=params.pipetteId, position_id=str(params.deckSlot.name)
=======
            pipette_id=params.pipetteId, position_id=str(params.deck_slot.name)
>>>>>>> 055e07927 (removed extended enum)
        )

        return MoveToLocationResult(
            position=new_position.position, positionId=new_position.positionId
        )


class MoveToLocation(BaseCommand[MoveToLocationParams, MoveToLocationResult]):
    """Calibration set up position command model."""

    commandType: MoveToLocationCommandType = "calibration/moveToLocation"
    params: MoveToLocationParams
    result: Optional[MoveToLocationResult]

    _ImplementationCls: Type[
        MoveToLocationImplementation
    ] = MoveToLocationImplementation


class MoveToLocationCreate(BaseCommandCreate[MoveToLocationParams]):
    """Calibration set up position command creation request model."""

    commandType: MoveToLocationCommandType = "calibration/moveToLocation"
    params: MoveToLocationParams

    _CommandCls: Type[MoveToLocation] = MoveToLocation