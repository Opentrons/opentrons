"""Calibration Move To Location command payload, result, and implementation models."""
from __future__ import annotations

from typing import TYPE_CHECKING, Type, Optional
from typing_extensions import Literal
from enum import Enum

from pydantic import BaseModel, Field

from opentrons.protocol_engine.commands.pipetting_common import PipetteIdMixin
from opentrons.protocol_engine.types import DeckPoint
from opentrons.types import DeckSlotName
from opentrons.protocol_engine.commands.command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
)

if TYPE_CHECKING:
    from opentrons.protocol_engine.execution import MovementHandler
    from opentrons.protocol_engine.state.state import StateView


MoveToLocationCommandType = Literal["calibration/moveToLocation"]


class CalibrationPosition(str, Enum):
    """Deck slot to move to."""

    PROBE_POSITION = "probePosition"
    ATTACH_OR_DETACH = "attachOrDetach"


class MoveToLocationParams(PipetteIdMixin):
    """Calibration set up position command parameters."""

    location: CalibrationPosition = Field(
        ...,
        description="Slot location to move to before starting calibration.",
    )


class MoveToLocationResult(BaseModel):
    """Result data from the execution of a CalibrationSetUpPosition command."""

    position: DeckPoint = Field(
        ...,
        description="Position in deck coordinates after this movement has been executed",
    )


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
        if params.location == CalibrationPosition.PROBE_POSITION:
            offset = DeckPoint(x=10, y=0, z=3)
            deck_center = self._state_view.labware.get_slot_center_position(
                DeckSlotName.SLOT_5
            )
            z_position = offset.z
        else:
            # get current z coordinate and pass it into movement destination
            offset = DeckPoint(x=0, y=0, z=0)
            deck_center = self._state_view.labware.get_slot_center_position(
                DeckSlotName.SLOT_2
            )
            current_position = await self._movement.save_position(
                pipette_id=params.pipetteId, position_id=None
            )
            z_position = current_position.position.z
        destination = DeckPoint(
            x=deck_center.x + offset.x, y=deck_center.y + offset.y, z=z_position
        )

        await self._movement.move_to_coordinates(
            pipette_id=params.pipetteId,
            deck_coordinates=destination,
            direct=True,
            additional_min_travel_z=None,
        )

        new_position = await self._movement.save_position(
            pipette_id=params.pipetteId, position_id=None
        )

        return MoveToLocationResult(position=new_position.position)


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
