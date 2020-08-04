from enum import Enum
from opentrons.types import Point
from robot_server.robot.calibration.constants import WILDCARD


class DeckCalibrationState(str, Enum):
    sessionStarted = "sessionStarted"
    labwareLoaded = "labwareLoaded"
    preparingPipette = "preparingPipette"
    savingPointOne = "savingPointOne"
    savingPointTwo = "savingPointTwo"
    savingPointThree = "savingPointThree"
    calibrationComplete = "calibrationComplete"
    sessionExited = "sessionExited"
    WILDCARD = WILDCARD


TIP_RACK_SLOT = '8'
MOVE_TO_TIP_RACK_SAFETY_BUFFER = Point(0, 0, 10)
MOVE_TO_POINT_SAFETY_BUFFER = Point(0, 0, 5)
