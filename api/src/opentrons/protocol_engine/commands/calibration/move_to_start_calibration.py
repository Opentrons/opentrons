"""Home command payload, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import TYPE_CHECKING, Optional, Sequence, Type
from typing_extensions import Literal

from ..types import MotorAxis
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from ...execution import MovementHandler


StartCalibrationCommandType = Literal["start calibration"]


class StartCalibrationParams(BaseModel):
    mount: MotorAxis = Field(
        LEFT_Z,
        description=(
            "Pipette mount to be calibrated (left or right)."
            "If omitted, will default to left."
        )
    )

    slot_location: DeckPoint = Field(
        None,  # make this location of a deck slot
        description=(
            "Slot location from which to start calibration."
        )
    )


class AxesLocation(MovementAxis):
    """Result data containing the position of the axes."""


# if movetocoordinates can be used, might not need movementhandler
class StartCalibrationImplementation(AbstractCommandImpl[StartCalibrationParams, AxesLocation]):
    def __init__(self, movement: MovementHandler, hardware_api: HardwareControlAPI, **kwargs: object) -> None:
        self._movement = movement

    def execute(self, params: StartCalibrationParams):
        # deckslotname - get_slot_center_position
        slot_center = get_slot_center_position()



    # subject = MoveToCoordinatesImplementation(
    #     state_view=state_view,
    #     hardware_api=hardware_api,
    #     movement=movement,
    # )
    #
    # params = MoveToCoordinatesParams(
    #     pipetteId="pipette-id",
    #     coordinates=DeckPoint(x=1.11, y=2.22, z=3.33),
    #     minimumZHeight=1234,
    #     forceDirect=True,
    # )
