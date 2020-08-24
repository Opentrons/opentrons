from enum import Enum
from opentrons.types import Point
from robot_server.robot.calibration.constants import STATE_WILDCARD


class PipetteOffsetCalibrationState(str, Enum):
    sessionStarted = "sessionStarted"
    labwareLoaded = "labwareLoaded"
    preparingPipette = "preparingPipette"
    inspectingTip = "inspectingTip"
    joggingToDeck = "joggingToDeck"
    joggingToPointOne = "joggingToPointOne"
    calibrationComplete = "calibrationComplete"
    sessionExited = "sessionExited"
    WILDCARD = STATE_WILDCARD


TIP_RACK_SLOT = '8'
MOVE_TO_TIP_RACK_SAFETY_BUFFER = Point(0, 0, 10)
MOVE_TO_POINT_SAFETY_BUFFER = Point(0, 0, 5)
