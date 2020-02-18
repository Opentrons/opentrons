""" Type definitions for modules in this tree """

from typing import Dict, NamedTuple


class MoveSplit(NamedTuple):
    split_distance: float
    split_current: float
    split_speed: float
    after_time: float


MoveSplits = Dict[str, MoveSplit]
#: Dict mapping axes to their split parameters
