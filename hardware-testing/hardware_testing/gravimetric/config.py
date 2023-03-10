"""Config."""
from dataclasses import dataclass
from typing import List
from typing_extensions import Final


@dataclass
class GravimetricConfig:
    """Execute Gravimetric Setup Config."""

    name: str
    pipette_volume: int
    pipette_mount: str
    tip_volume: int
    trials: int
    labware_offsets: List[dict]
    slot_vial: int
    slots_tiprack: List[int]
    increment: bool
    low_volume: bool
    return_tip: bool


GRAV_CONFIG_EXCLUDE_FROM_REPORT = ["labware_offsets", "slots_tiprack"]

NUM_BLANK_TRIALS: Final = 3
NUM_MIXES_BEFORE_ASPIRATE = 5

LOW_VOLUME_UPPER_LIMIT_UL: Final = 2.0

GANTRY_MAX_SPEED = 50
TIP_SPEED_WHILE_SUBMERGED = 5

VIAL_SAFE_Z_OFFSET: Final = 10
LABWARE_BOTTOM_CLEARANCE = 1.5
