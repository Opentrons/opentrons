"""backends.types - wrapper types for api/backend interaction"""

from enum import Enum, auto


class HWStopCondition(Enum):
    none = auto()
    limit_switch = auto()
    sync_line = auto()
    encoder_position = auto()
    gripper_force = auto()
    stall = auto()
    ignore_stalls = auto()
    limit_switch_backoff = auto()
