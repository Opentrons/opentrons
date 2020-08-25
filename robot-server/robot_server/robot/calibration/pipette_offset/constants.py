from enum import Enum
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


JOG_TO_DECK_SLOT = '5'
TIP_RACK_SLOT = '8'
