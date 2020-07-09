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


TRASH_SLOT = '12'
TIP_RACK_SLOT = '8'
LEFT_MOUNT_CAL_BLOCK_SLOT = '3'
LEFT_MOUNT_CAL_BLOCK_LOADNAME = 'opentrons_calibrationblock_short_side_right'
RIGHT_MOUNT_CAL_BLOCK_SLOT = '1'
RIGHT_MOUNT_CAL_BLOCK_LOADNAME = 'opentrons_calibrationblock_short_side_left'
