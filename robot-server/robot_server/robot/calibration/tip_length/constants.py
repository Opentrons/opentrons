from opentrons_shared_data.util import StrEnum

from robot_server.robot.calibration.constants import STATE_WILDCARD


class TipCalibrationState(StrEnum):
    sessionStarted = "sessionStarted"
    labwareLoaded = "labwareLoaded"
    measuringNozzleOffset = "measuringNozzleOffset"
    preparingPipette = "preparingPipette"
    inspectingTip = "inspectingTip"
    measuringTipOffset = "measuringTipOffset"
    calibrationComplete = "calibrationComplete"
    sessionExited = "sessionExited"
    WILDCARD = STATE_WILDCARD


TIP_RACK_SLOT = "8"
