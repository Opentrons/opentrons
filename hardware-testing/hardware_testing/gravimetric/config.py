"""Config."""
from dataclasses import dataclass
from typing import List, Dict
from typing_extensions import Final
from enum import Enum


class ConfigType(Enum):
    """Substitute for Literal which isn't available until 3.8.0."""

    gravimetric = 1
    photometric = 2


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
    kind: ConfigType
    extra: bool


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

VIAL_SAFE_Z_OFFSET: Final = 25
LABWARE_BOTTOM_CLEARANCE = 1.5


QC_VOLUMES_G: Dict[int, Dict[int, Dict[int, List[float]]]] = {
    1: {
        50: {  # P50
            50: [1.0, 50.0],  # T50
        },
        1000: {  # P1000
            50: [5.0],  # T50
            200: [],  # T200
            1000: [1000.0],  # T1000
        },
    },
    8: {
        50: {  # P50
            50: [1.0, 50.0],  # T50
        },
        1000: {  # P1000
            50: [5.0],  # T50
            200: [],  # T200
            1000: [1000.0],  # T1000
        },
    },
    96: {
        1000: {  # P1000
            50: [],  # T50
            200: [],  # T200
            1000: [1000.0],  # T1000
        },
    },
}


QC_VOLUMES_EXTRA_G: Dict[int, Dict[int, Dict[int, List[float]]]] = {
    1: {
        50: {  # P50
            50: [1.0, 10.0, 50.0],  # T50
        },
        1000: {  # P1000
            50: [5.0, 50],  # T50
            200: [200.0],  # T200
            1000: [1000.0],  # T1000
        },
    },
    8: {
        50: {  # P50
            50: [1.0, 10.0, 50.0],  # T50
        },
        1000: {  # P1000
            50: [5.0, 50],  # T50
            200: [200.0],  # T200
            1000: [1000.0],  # T1000
        },
    },
    96: {
        1000: {  # P1000
            50: [],  # T50
            200: [],  # T200
            1000: [1000.0],  # T1000
        },
    },
}

QC_VOLUMES_P: Dict[int, Dict[int, Dict[int, List[float]]]] = {
    96: {
        1000: {  # P1000
            50: [5.0],  # T50
            200: [200.0],  # T200
            1000: [],  # T1000
        },
    },
}

QC_DEFAULT_TRIALS: Dict[ConfigType, Dict[int, int]] = {
    ConfigType.gravimetric: {
        1: 10,
        8: 8,
        96: 9,
    },
    ConfigType.photometric: {
        96: 5,
    },
}


def get_tip_volumes_for_qc(
    pipette_volume: int, pipette_channels: int, extra: bool, photometric: bool
) -> List[int]:
    """Build the default testing volumes for qc."""
    config: Dict[int, Dict[int, Dict[int, List[float]]]] = {}
    if photometric:
        config = QC_VOLUMES_P
    else:
        if extra:
            config = QC_VOLUMES_EXTRA_G
        else:
            config = QC_VOLUMES_G
    tip_volumes = [
        t
        for t in config[pipette_channels][pipette_volume].keys()
        if len(config[pipette_channels][pipette_volume][t]) > 0
    ]
    assert len(tip_volumes) > 0
    return tip_volumes
