"""Home command payload, result, and implementation models."""
from __future__ import annotations
from enum import Enum
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
from opentrons.types import DeckSlotName

if TYPE_CHECKING:
    from opentrons.protocol_engine.execution import MovementHandler
    from opentrons.protocol_engine.state.state import StateView
    from opentrons.protocol_engine.state.labware import LabwareView

CalibrationSetUpPositionCommandType = Literal["CalibrationSetUpPosition"]


class CalibrationPositions(DeckSlotName, Enum):
    start_calibration = (DeckSlotName.SLOT_5,)
    probe_interaction = (DeckSlotName.SLOT_2,)


class CalibrationSetUpPositionParams(PipetteIdMixin):
    slot_name: CalibrationPositions = Field(
        CalibrationPositions.start_calibration,
        description="Slot location to move to before starting calibration.",
    )


class CalibrationSetUpPositionResult(BaseModel):
    """Result data containing the position of the axes."""

    pass


class CalibrationSetUpPositionImplementation(
    AbstractCommandImpl[CalibrationSetUpPositionParams, CalibrationSetUpPositionResult]
):
    """Calibration set up position command implementation."""

    def __init__(
        self, movement: MovementHandler, state_view: StateView, **kwargs: object
    ) -> None:
        self._movement = movement
        self._state_view = state_view

    async def execute(
        self, params: CalibrationSetUpPositionParams
    ) -> CalibrationSetUpPositionResult:
        """Move the requested pipette to a given deck slot."""

        print("state_view =", self._state_view)
        print("labware =", self._state_view.labware)
        print("function =", self._state_view.labware.get_slot_center_position)
        print("slot name =", params.slot_name)
        slot_center = self._state_view.labware.get_slot_center_position(
            DeckSlotName.SLOT_5
        )
        print("slot center =", slot_center)
        slot_center_deck = DeckPoint(x=slot_center.x, y=slot_center.y, z=slot_center.z)
        print("slot center deck =", slot_center_deck)
        breakpoint()
        # should additional_min_travel_z be 0 ?
        await self._movement.move_to_coordinates(
            pipette_id=params.pipetteId,
            deck_coordinates=slot_center_deck,
            direct=True,
            additional_min_travel_z=0,
        )
        return CalibrationSetUpPositionResult()


class CalibrationSetUpPosition(
    BaseCommand[CalibrationSetUpPositionParams, CalibrationSetUpPositionResult]
):
    """Calibration set up position command model."""

    commandType: CalibrationSetUpPositionCommandType = "CalibrationSetUpPosition"
    params: CalibrationSetUpPositionParams

    _ImplementationCls: Type[
        CalibrationSetUpPositionImplementation
    ] = CalibrationSetUpPositionImplementation


class CalibrationSetUpPositionCreate(BaseCommandCreate[CalibrationSetUpPositionParams]):
    """Calibration set up position command creation request model."""

    commandType: CalibrationSetUpPositionCommandType = "CalibrationSetUpPosition"
    params: CalibrationSetUpPositionParams

    _CommandCls: Type[CalibrationSetUpPosition] = CalibrationSetUpPosition
