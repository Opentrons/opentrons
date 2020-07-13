from enum import Enum
from typing import Dict
from opentrons.types import Point, Mount

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


TIP_RACK_SLOT = '8'
LEFT_MOUNT_CAL_BLOCK_SLOT = '3'
LEFT_MOUNT_CAL_BLOCK_LOADNAME = 'opentrons_calibrationblock_short_side_right'
RIGHT_MOUNT_CAL_BLOCK_SLOT = '1'
RIGHT_MOUNT_CAL_BLOCK_LOADNAME = 'opentrons_calibrationblock_short_side_left'

MOVE_TO_TIP_RACK_SAFETY_BUFFER = Point(0, 0, 10)

CAL_BLOCK_SETUP_BY_MOUNT: Dict[Mount, Dict[str, str]] = {
    Mount.LEFT: {
        'load_name': LEFT_MOUNT_CAL_BLOCK_LOADNAME,
        'slot': LEFT_MOUNT_CAL_BLOCK_SLOT,
    },
    Mount.RIGHT: {
        'load_name': RIGHT_MOUNT_CAL_BLOCK_LOADNAME,
        'slot': RIGHT_MOUNT_CAL_BLOCK_SLOT,
    }
}
