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
    slot_tiprack: int
    increment: bool
    low_volume: bool


@dataclass
class EnvironmentData:
    """Environment data."""

    celsius_pipette: float
    celsius_air: float
    humidity_air: float
    pascals_air: float
    celsius_liquid: float


@dataclass
class MeasurementData(EnvironmentData):
    """Measurement data."""

    grams_average: float
    grams_cv: float
    grams_min: float
    grams_max: float
    samples_start_time: float
    samples_duration: float
    samples_count: int


GRAV_CONFIG_EXCLUDE_FROM_REPORT = ["labware_offsets"]

NUM_BLANK_TRIALS: Final = 3
NUM_MIXES_BEFORE_ASPIRATE = 5

LOW_VOLUME_UPPER_LIMIT_UL: Final = 2.0

DELAY_SECONDS_BEFORE_ASPIRATE: Final = 1
DELAY_SECONDS_AFTER_ASPIRATE: Final = 1
DELAY_SECONDS_AFTER_DISPENSE: Final = 1

TIP_SPEED_WHILE_SUBMERGED = 5

VIAL_SAFE_Z_OFFSET: Final = 10
LABWARE_BOTTOM_CLEARANCE = 1.5
