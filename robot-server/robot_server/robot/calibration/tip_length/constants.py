from enum import Enum

WILDCARD = '*'


class TipCalibrationState(str, Enum):
    sessionStarted = "sessionStarted"
    labwareLoaded = "labwareLoaded"
    measuringNozzleOffset = "measuringNozzleOffset"
    preparingPipette = "preparingPipette"
    measuringTipOffset = "measuringTipOffset"
    calibrationComplete = "calibrationComplete"
    sessionExited = "sessionExited"
    WILDCARD = WILDCARD
