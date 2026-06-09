"""Config."""
from dataclasses import dataclass
from typing import List, Dict, Tuple


@dataclass
class VolumetricConfig:
    """Execute shared volumetric Setup Config."""

    name: str
    pipette_volume: int
    pipette_channels: int
    pipette_mount: str
    tip_volume: int
    trials: int
    slots_tiprack: List[int]
    increment: bool
    return_tip: bool
    mix: bool
    user_volumes: bool
    kind: str
    extra: bool
    jog: bool
    same_tip: bool
    ignore_fail: bool
    mode: str


@dataclass
class GravimetricConfig(VolumetricConfig):
    """Execute Gravimetric Setup Config."""

    labware_on_scale: str
    slot_scale: int
    blank: bool
    gantry_speed: int
    scale_delay: int
    isolate_channels: List[int]
    isolate_volumes: List[float]
    liquid: str


GRAV_CONFIG_EXCLUDE_FROM_REPORT = ["labware_offsets", "slots_tiprack"]

GANTRY_MAX_SPEED = 40

LABWARE_BOTTOM_CLEARANCE = 1.5

QC_TEST_SAFETY_FACTOR = 0.0

QC_TEST_MIN_REQUIREMENTS: Dict[
    int, Dict[int, Dict[int, Dict[float, Tuple[float, float]]]]
] = {
    # channels: [Pipette: [tip: [Volume: (%d, Cv)]]]
    1: {
        50: {  # P50
            20: {
                1.0: (5.0, 4.0),
                10.0: (1.0, 0.5),
                20.0: (1, 0.4),
            },
            50: {
                1.0: (5.0, 4.0),
                10.0: (1.0, 0.5),
                50.0: (1, 0.4),
            },
        },  # T50
        1000: {  # P1000
            50: {  # T50
                5.0: (5.0, 5.0),
                10.0: (2.0, 2.0),
                50.0: (1.0, 1.0),
            },
            200: {  # T200
                5.0: (7.0, 4.00),
                50.0: (2.0, 1.0),
                200.0: (0.5, 0.2),
            },
            1000: {  # T1000
                10.0: (7.5, 3.5),
                100.0: (2.0, 0.75),
                1000.0: (0.7, 0.15),
            },
        },
    },
    8: {
        50: {  # P50
            50: {  # T50
                1.0: (20.0, 5.0),
                10.0: (3.0, 2.0),
                50.0: (1.25, 0.4),
            },
        },
        1000: {  # P1000
            50: {  # T50
                5.0: (5.0, 5.0),
                10.0: (1.5, 1.5),
                50.0: (1.0, 1.0),
            },
            200: {  # T200
                5.0: (5.0, 5.0),
                50.0: (1.5, 1.5),
                200.0: (1.0, 0.4),
            },
            1000: {  # T1000
                10.0: (10.0, 5.0),
                100.0: (2.5, 1.0),
                1000.0: (0.7, 0.15),
            },
        },
    },
    96: {
        200: {
            20: {  # T20
                0.5: (2.5, 2.0),
                1.0: (2.5, 2.0),
                2.0: (2.5, 2.0),
                3.0: (2.5, 2.0),
                5.0: (2.5, 2.0),
                10.0: (3.1, 1.7),
            },
            50: {  # T50
                1.0: (2.5, 2.0),
                50.0: (1.5, 0.75),
            },
            200: {  # T200
                5.0: (2.5, 4.0),
                50.0: (1.5, 2.0),
                200.0: (1.4, 0.9),
            },
        },
        1000: {  # P1000
            20: {  # T20
                1.0: (2.5, 2.0),
                2.0: (2.5, 2.0),
                3.0: (2.5, 2.0),
                5.0: (2.5, 2.0),
                10.0: (3.1, 1.7),
                20.0: (3.1, 1.7),
            },
            50: {  # T50
                1.0: (2.5, 2.0),
                2.0: (2.5, 2.0),
                3.0: (2.5, 2.0),
                5.0: (2.5, 2.0),
                10.0: (3.1, 1.7),
                50.0: (1.5, 0.75),
            },
            200: {  # T200
                5.0: (2.5, 4.0),
                50.0: (1.5, 2.0),
                200.0: (1.4, 0.9),
            },
            1000: {  # T1000
                10.0: (5.0, 5.0),
                100.0: (2.5, 1.5),
                1000.0: (1.0, 0.75),
            },
        },
    },
}
