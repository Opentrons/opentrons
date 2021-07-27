from typing import Dict, Union
from typing_extensions import Literal

from enum import Enum
from opentrons.types import Point

from robot_server.robot.calibration.constants import (
    STATE_WILDCARD,
    POINT_ONE_ID,
    POINT_TWO_ID,
    POINT_THREE_ID,
)


class CalibrationCheckState(str, Enum):
    sessionStarted = "sessionStarted"
    labwareLoaded = "labwareLoaded"
    inspectingTip = "inspectingTip"
    preparingPipette = "preparingPipette"
    comparingNozzle = "comparingNozzle"
    comparingTip = "comparingTip"
    comparingHeight = "comparingHeight"
    comparingPointOne = "comparingPointOne"
    comparingPointTwo = "comparingPointTwo"
    comparingPointThree = "comparingPointThree"
    returningTip = "returningTip"
    resultsSummary = "resultsSummary"
    sessionExited = "sessionExited"
    calibrationComplete = "calibrationComplete"
    WILDCARD = STATE_WILDCARD


# The tolerances below are absolute values that a pipette
# might be off due to things that cannot be controlled
# such as tip straightness or slight changes betweeen
# tip length. Please review the Motion research for
# further information.
PIPETTE_TOLERANCES = {
    "p1000_crosses": Point(2.7, 2.7, 0.0),
    "p1000_height": Point(0.0, 0.0, 1.0),
    "p300_crosses": Point(1.8, 1.8, 0.0),
    "p20_crosses": Point(1.4, 1.4, 0.0),
    "other_height": Point(0.0, 0.0, 0.8),
    "p20_tip": Point(0.0, 0.0, 0.50),
    "p300_tip": Point(0.0, 0.0, 1.0),
    "p1000_tip": Point(0.0, 0.0, 1.0),
}

TIPRACK_SLOT = "8"

StatePointMap = Dict[CalibrationCheckState, Union[Literal["1BLC", "3BRC", "7TLC"]]]

MOVE_POINT_STATE_MAP: StatePointMap = {
    CalibrationCheckState.comparingHeight: POINT_ONE_ID,
    CalibrationCheckState.comparingPointOne: POINT_TWO_ID,
    CalibrationCheckState.comparingPointTwo: POINT_THREE_ID,
}
