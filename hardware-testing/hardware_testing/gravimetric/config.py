"""Config."""
from dataclasses import dataclass
from typing import List, Dict, Tuple
from typing_extensions import Final
from enum import Enum
from opentrons.config.types import LiquidProbeSettings


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

DEFAULT_LIQUID_PROBE_SETTINGS: Final[LiquidProbeSettings] = LiquidProbeSettings(
    starting_mount_height=40,
    max_z_distance=40,
    min_z_distance=5,
    mount_speed=10,
    plunger_speed=5,
    sensor_threshold_pascals=40,
    expected_liquid_height=110,
    log_pressure=True,
    aspirate_while_sensing=False,
    auto_zero_sensor=True,
    num_baseline_reads=10,
    data_file="/var/pressure_sensor_data.csv",
)

QC_VOLUMES_G: Dict[int, Dict[int, List[Tuple[int, List[float]]]]] = {
    1: {
        50: [  # P50
            (50, [1.0, 50.0]),  # T50
        ],
        1000: [  # P1000
            (50, [5.0]),  # T50
            (200, []),  # T200
            (1000, [1000.0]),  # T1000
        ],
    },
    8: {
        50: [  # P50
            (50, [1.0, 50.0]),  # T50
        ],
        1000: [  # P1000
            (50, [5.0]),  # T50
            (200, []),  # T200
            (1000, [1000.0]),  # T1000
        ],
    },
    96: {
        1000: [  # P1000
            (50, []),  # T50
            (200, []),  # T200
            (1000, [1000.0]),  # T1000
        ],
    },
}


QC_VOLUMES_EXTRA_G: Dict[int, Dict[int, List[Tuple[int, List[float]]]]] = {
    1: {
        50: [  # P50
            (50, [10.0]),  # T50
        ],
        1000: [  # P1000
            (50, [50]),  # T50
            (200, [200.0]),  # T200
            (1000, []),  # T1000
        ],
    },
    8: {
        50: [  # P50
            (50, [10.0]),  # T50
        ],
        1000: [  # P1000
            (50, [50.0]),  # T50
            (200, [200.0]),  # T200
            (1000, []),  # T1000
        ],
    },
    96: {
        1000: [  # P1000
            (50, []),  # T50
            (200, []),  # T200
            (1000, []),  # T1000
        ],
    },
}

QC_VOLUMES_P: Dict[int, Dict[int, List[Tuple[int, List[float]]]]] = {
    96: {
        1000: [  # P1000
            (50, [5.0]),  # T50
            (200, [200.0]),  # T200
            (1000, []),  # T1000
        ],
    },
}

QC_DEFAULT_TRIALS: Dict[ConfigType, Dict[int, int]] = {
    ConfigType.gravimetric: {
        1: 10,
        8: 10,
        96: 9,
    },
    ConfigType.photometric: {
        96: 5,
    },
}

QC_TEST_MIN_REQUIREMENTS: Dict[
    int, Dict[int, Dict[int, Dict[float, Tuple[float, float]]]]
] = {
    # channels: [Pipette: [tip: [Volume: (%d, Cv)]]]
    1: {
        50: {  # P50
            50: {
                1.0: (3.0, 3.75),
                10.0: (0.38, 0.75),
                50.0: (0.3, 0.75),
            },
        },  # T50
        1000: {  # P1000
            50: {  # T50
                5.0: (3.75, 3.75),
                10.0: (1.5, 1.5),
                50.0: (0.75, 0.75),
            },
            200: {  # T200
                5.0: (5.25, 3.00),
                50.0: (1.5, 0.75),
                200.0: (0.38, 0.15),
            },
            1000: {  # T1000
                10.0: (5.63, 2.63),
                100.0: (1.5, 0.56),
                1000.0: (0.53, 0.11),
            },
        },
    },
    8: {
        50: {  # P50
            50: {  # T50
                1.0: (15.0, 3.75),
                10.0: (2.25, 1.5),
                50.0: (0.94, 0.3),
            },
        },
        1000: {  # P1000
            50: {  # T50
                5.0: (3.75, 3.75),
                10.0: (1.13, 1.13),
                50.0: (0.75, 0.75),
            },
            200: {  # T200
                5.0: (3.75, 3.75),
                50.0: (1.13, 1.13),
                200.0: (0.75, 0.3),
            },
            1000: {  # T1000
                10.0: (7.5, 3.75),
                100.0: (1.88, 0.75),
                1000.0: (0.53, 0.11),
            },
        },
    },
    96: {
        1000: {  # P1000
            50: {  # T50
                5.0: (1.88, 1.5),
                10.0: (2.33, 1.28),
                50.0: (1.13, 0.56),
            },
            200: {  # T200
                5.0: (1.88, 3.0),
                50.0: (1.13, 1.5),
                200.0: (1.05, 0.68),
            },
            1000: {  # T1000
                10.0: (3.75, 3.75),
                100.0: (1.88, 1.13),
                1000.0: (0.75, 0.56),
            },
        },
    },
}


def get_tip_volumes_for_qc(
    pipette_volume: int, pipette_channels: int, extra: bool, photometric: bool
) -> List[int]:
    """Build the default testing volumes for qc."""
    config: Dict[int, Dict[int, List[Tuple[int, List[float]]]]] = {}
    tip_volumes: List[int] = []
    if photometric:
        config = QC_VOLUMES_P
    else:
        config = QC_VOLUMES_G
    for t, vls in config[pipette_channels][pipette_volume]:
        if len(vls) > 0 and t not in tip_volumes:
            tip_volumes.append(t)
    if extra:
        for t, vls in QC_VOLUMES_EXTRA_G[pipette_channels][pipette_volume]:
            if len(vls) > 0 and t not in tip_volumes:
                tip_volumes.append(t)

    assert len(tip_volumes) > 0
    return tip_volumes
