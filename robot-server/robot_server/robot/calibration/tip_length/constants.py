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
LEFT_MOUNT_CAL_BLOCK_WELL = 'A1'
RIGHT_MOUNT_CAL_BLOCK_SLOT = '1'
RIGHT_MOUNT_CAL_BLOCK_LOADNAME = 'opentrons_calibrationblock_short_side_left'
RIGHT_MOUNT_CAL_BLOCK_WELL = 'A2'

TRASH_REF_POINT_OFFSET = Point(26, 33, 0)  # offset from corner of slot 12
MOVE_TO_TIP_RACK_SAFETY_BUFFER = Point(0, 0, 10)
MOVE_TO_REF_POINT_SAFETY_BUFFER = Point(0, 0, 5)

CAL_BLOCK_SETUP_BY_MOUNT: Dict[Mount, Dict[str, str]] = {
    Mount.LEFT: {
        'load_name': LEFT_MOUNT_CAL_BLOCK_LOADNAME,
        'slot': LEFT_MOUNT_CAL_BLOCK_SLOT,
        'well': LEFT_MOUNT_CAL_BLOCK_WELL,
    },
    Mount.RIGHT: {
        'load_name': RIGHT_MOUNT_CAL_BLOCK_LOADNAME,
        'slot': RIGHT_MOUNT_CAL_BLOCK_SLOT,
        'well': RIGHT_MOUNT_CAL_BLOCK_WELL,
    }
}
