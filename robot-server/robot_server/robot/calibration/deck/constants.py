from __future__ import annotations

from enum import Enum
from typing import TYPE_CHECKING
from opentrons.types import Point
from robot_server.robot.calibration.constants import STATE_WILDCARD

if TYPE_CHECKING:
    from typing_extensions import Final
    from .dev_types import StatePointMap


class DeckCalibrationState(str, Enum):
    sessionStarted = "sessionStarted"
    labwareLoaded = "labwareLoaded"
    preparingPipette = "preparingPipette"
    inspectingTip = "inspectingTip"
    joggingToDeck = "joggingToDeck"
    savingPointOne = "savingPointOne"
    savingPointTwo = "savingPointTwo"
    savingPointThree = "savingPointThree"
    calibrationComplete = "calibrationComplete"
    sessionExited = "sessionExited"
    WILDCARD = STATE_WILDCARD


POINT_ONE_ID: Final = '1BLC'
POINT_TWO_ID: Final = '3BRC'
POINT_THREE_ID: Final = '7TLC'
JOG_TO_DECK_SLOT = '5'
TIP_RACK_SLOT = '8'

MOVE_TO_DECK_SAFETY_BUFFER = Point(0, 10, 5)
MOVE_TO_TIP_RACK_SAFETY_BUFFER = Point(0, 0, 10)

MOVE_POINT_STATE_MAP: StatePointMap = {
    DeckCalibrationState.joggingToDeck: POINT_ONE_ID,
    DeckCalibrationState.savingPointOne: POINT_TWO_ID,
    DeckCalibrationState.savingPointTwo: POINT_THREE_ID
}
SAVE_POINT_STATE_MAP: StatePointMap = {
    DeckCalibrationState.savingPointOne: POINT_ONE_ID,
    DeckCalibrationState.savingPointTwo: POINT_TWO_ID,
    DeckCalibrationState.savingPointThree: POINT_THREE_ID
}
