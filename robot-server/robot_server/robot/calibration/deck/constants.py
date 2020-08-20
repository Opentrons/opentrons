from enum import Enum
from opentrons.types import Point
from robot_server.robot.calibration.constants import STATE_WILDCARD


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


POINT_ONE_ID = '1BLC'
POINT_TWO_ID = '3BRC'
POINT_THREE_ID = '7TLC'
JOG_TO_DECK_SLOT = '5'
TIP_RACK_SLOT = '8'

MOVE_TO_TIP_RACK_SAFETY_BUFFER = Point(0, 0, 10)
MOVE_TO_POINT_SAFETY_BUFFER = Point(0, 0, 5)
JOG_TO_DECK_Y_SHIFT = 10
