from enum import Enum
from typing import Dict
from opentrons.types import Point, Mount
from robot_server.robot.calibration.constants import STATE_WILDCARD


class TipCalibrationState(str, Enum):
    sessionStarted = "sessionStarted"
    labwareLoaded = "labwareLoaded"
    measuringNozzleOffset = "measuringNozzleOffset"
    preparingPipette = "preparingPipette"
    inspectingTip = "inspectingTip"
    measuringTipOffset = "measuringTipOffset"
    calibrationComplete = "calibrationComplete"
    sessionExited = "sessionExited"
    WILDCARD = STATE_WILDCARD


TIP_RACK_SLOT = '8'
