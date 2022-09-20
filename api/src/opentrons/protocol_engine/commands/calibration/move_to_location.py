"""Calibration Move To Location command payload, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import TYPE_CHECKING, Type
from typing_extensions import Literal

from opentrons.protocol_engine.commands.pipetting_common import PipetteIdMixin
from opentrons.protocol_engine.commands.command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
)
from opentrons.protocol_engine.types import DeckPoint
from opentrons.types import CalibrationPositions

if TYPE_CHECKING:
    from opentrons.protocol_engine.execution import MovementHandler
    from opentrons.protocol_engine.state.state import StateView

MoveToLocationCommandType = Literal["MoveToLocation"]


class MoveToLocationParams(PipetteIdMixin):
    """Calibration set up position command parameters."""

    slot_name: CalibrationPositions = Field(
        CalibrationPositions.probe_position,
        description="Slot location to move to before starting calibration.",
    )


class MoveToLocationResult(BaseModel):
    """Result data from the execution of a CalibrationSetUpPosition command."""

    pass


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
        slot_center = self._state_view.labware.get_slot_center_position(
            params.slot_name
        )

        # slot center deck has 3mm safety margin
        slot_center_deck = DeckPoint(
            x=slot_center.x, y=slot_center.y, z=slot_center.z + 3
        )
        await self._movement.move_to_coordinates(
            pipette_id=params.pipetteId,
            deck_coordinates=slot_center_deck,
            direct=True,
            additional_min_travel_z=0,
        )
        return MoveToLocationResult()


class MoveToLocation(BaseCommand[MoveToLocationParams, MoveToLocationResult]):
    """Calibration set up position command model."""

    commandType: MoveToLocationCommandType = "MoveToLocation"
    params: MoveToLocationParams

    _ImplementationCls: Type[
        MoveToLocationImplementation
    ] = MoveToLocationImplementation


class MoveToLocationCreate(BaseCommandCreate[MoveToLocationParams]):
    """Calibration set up position command creation request model."""

    commandType: MoveToLocationCommandType = "MoveToLocation"
    params: MoveToLocationParams

    _CommandCls: Type[MoveToLocation] = MoveToLocation
