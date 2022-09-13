"""Home command payload, result, and implementation models."""
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
from opentrons.types import DeckSlotName
from opentrons.protocol_engine.state.state import StateView

if TYPE_CHECKING:
    from opentrons.protocol_engine.execution import MovementHandler


StartCalibrationCommandType = Literal["CalibrationSetUpPosition"]


class CalibrationSetUpPositionParams(PipetteIdMixin):
    slot_name: DeckSlotName = Field(
        DeckSlotName.SLOT_5,
        description="Slot location to move to before starting calibration.",
    )


class CalibrationSetUpPositionResult(BaseModel):
    """Result data containing the position of the axes."""

    result: DeckPoint


class CalibrationSetUpPositionImplementation(
    AbstractCommandImpl[CalibrationSetUpPositionParams, CalibrationSetUpPositionResult]
):
    """Calibration set up position command implementation."""
    def __init__(
        self, movement: MovementHandler, state_view: StateView, **kwargs: object
    ) -> None:
        self._movement = movement
        self._state_view = state_view

    async def execute(self, params: CalibrationSetUpPositionParams) -> CalibrationSetUpPositionResult:
        """Move the requested pipette to a given deck slot."""

        slot_center = self._state_view.labware.get_slot_center_position(
            params.slot_name
        )
        slot_center_deck = DeckPoint(x=slot_center.x, y=slot_center.y, z=slot_center.z)
        # should additional_min_travel_z be 0 ?
        await self._movement.move_to_coordinates(
            pipette_id=params.pipetteId,
            deck_coordinates=slot_center_deck,
            direct=True,
            additional_min_travel_z=0,
        )
        return StartCalibrationResult(result=slot_center_deck)


class CalibrationSetUpPosition(BaseCommand[CalibrationSetUpPositionParams, CalibrationSetUpPositionResult]):
    """Calibration set up position command model."""

    commandType: StartCalibrationCommandType = "startCalibration"
    params: CalibrationSetUpPositionParams
    result: CalibrationSetUpPositionResult

    _Implementation: Type[
        CalibrationSetUpPositionImplementation
    ] = CalibrationSetUpPositionImplementation


class CalibrationSetUpPositionCreate(BaseCommandCreate[StartCalibrationParams]):
    """Calibration set up position command creation request model."""

    commandType: CalibrationSetUpPositionCommandType = "CalibrationSetUpPosition"
    params: CalibrationSetUpPositionParams

    _CommandCls: Type[CalibrationSetUpPosition] = CalibrationSetUpPosition
