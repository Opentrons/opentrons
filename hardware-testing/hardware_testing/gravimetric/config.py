"""Config."""
from dataclasses import dataclass
from typing import List
from typing_extensions import Final


@dataclass
class VolumetricConfig:
    """Execute shared volumetric Setup Config."""

    name: str
    pipette_volume: int
    pipette_channels: int
    pipette_mount: str
    tip_volume: int
    trials: int
    labware_offsets: List[dict]
    slots_tiprack: List[int]
    increment: bool
    return_tip: bool
    mix: bool
    inspect: bool
    user_volumes: bool


@dataclass
class GravimetricConfig(VolumetricConfig):
    """Execute Gravimetric Setup Config."""

    labware_on_scale: str
    slot_scale: int
    blank: bool
    gantry_speed: int
    scale_delay: int
    isolate_channels: List[int]


@dataclass
class PhotometricConfig(VolumetricConfig):
    """Execute photometric Setup Config."""

    photoplate: str
    photoplate_slot: int
    reservoir: str
    reservoir_slot: int
    touch_tip: bool
    refill: bool


GRAV_CONFIG_EXCLUDE_FROM_REPORT = ["labware_offsets", "slots_tiprack"]
PHOTO_CONFIG_EXCLUDE_FROM_REPORT = ["labware_offsets", "slots_tiprack"]

NUM_BLANK_TRIALS: Final = 3
NUM_MIXES_BEFORE_ASPIRATE = 5
SCALE_SECONDS_TO_TRUE_STABILIZE = 30

LOW_VOLUME_UPPER_LIMIT_UL: Final = 2.0

TOUCH_TIP_SPEED = 30

GANTRY_MAX_SPEED = 40
TIP_SPEED_WHILE_SUBMERGING_ASPIRATE = 50
TIP_SPEED_WHILE_SUBMERGING_DISPENSE = 50
TIP_SPEED_WHILE_RETRACTING_ASPIRATE = 50
TIP_SPEED_WHILE_RETRACTING_DISPENSE = 50

VIAL_SAFE_Z_OFFSET: Final = 10
LABWARE_BOTTOM_CLEARANCE = 1.5
