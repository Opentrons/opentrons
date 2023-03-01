"""Defaults."""
from typing import List

from .definition import (
    LiquidClassSettings,
    AspirateSettings,
    DispenseSettings,
    AirGapSettings,
)

# dispense settings are constant across volumes
_dispense_default_submerge_mm = 1.0
_dispense_default_retract_mm = 1.0
_dispense_defaults = {
    50: {  # P50
        50: DispenseSettings(  # T50
            flow_rate=600,
            delay=0.4,
            submerge=_dispense_default_submerge_mm,
            retract=_dispense_default_retract_mm,
            acceleration=40000,
            deceleration=40000,
        ),
    },
    1000: {  # P1000
        50: DispenseSettings(  # T50
            flow_rate=600,
            delay=0.4,
            submerge=_dispense_default_submerge_mm,
            retract=_dispense_default_retract_mm,
            acceleration=10000,
            deceleration=20000,
        ),
        200: DispenseSettings(  # T200
            flow_rate=600,
            delay=0,
            submerge=_dispense_default_submerge_mm,
            retract=_dispense_default_retract_mm,
            acceleration=10000,
            deceleration=20000,
        ),
        1000: DispenseSettings(  # T1000
            flow_rate=600,
            delay=0,
            submerge=_dispense_default_submerge_mm,
            retract=_dispense_default_retract_mm,
            acceleration=10000,
            deceleration=20000,
        ),
    },
}

_aspirate_default_submerge_mm = 1.0
_aspirate_default_retract_mm = 1.0
OT3_LIQUID_CLASS = {
    50: {  # P50
        50: {  # T50
            1: LiquidClassSettings(  # 1uL
                aspirate=AspirateSettings(
                    flow_rate=20,
                    delay=0.2,
                    submerge=_aspirate_default_submerge_mm,
                    retract=_aspirate_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=2,
                        trailing_air_gap=2,
                    ),
                ),
                dispense=_dispense_defaults[50][50],
            ),
            10: LiquidClassSettings(  # 10uL
                aspirate=AspirateSettings(
                    flow_rate=5.7,
                    delay=0.2,
                    submerge=_aspirate_default_submerge_mm,
                    retract=_aspirate_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=2,
                        trailing_air_gap=0.1,
                    ),
                ),
                dispense=_dispense_defaults[50][50],
            ),
            50: LiquidClassSettings(  # 50uL
                aspirate=AspirateSettings(
                    flow_rate=44.2,
                    delay=0.2,
                    submerge=_aspirate_default_submerge_mm,
                    retract=_aspirate_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=2,
                        trailing_air_gap=0.1,
                    ),
                ),
                dispense=_dispense_defaults[50][50],
            ),
        },
    },
    1000: {  # P1000
        50: {  # T50
            5: LiquidClassSettings(  # 5uL
                aspirate=AspirateSettings(
                    flow_rate=20,
                    delay=0.2,
                    submerge=_aspirate_default_submerge_mm,
                    retract=_aspirate_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=15,
                        trailing_air_gap=2,
                    ),
                ),
                dispense=_dispense_defaults[1000][50],
            ),
            10: LiquidClassSettings(  # 10uL
                aspirate=AspirateSettings(
                    flow_rate=5.7,
                    delay=0.2,
                    submerge=_aspirate_default_submerge_mm,
                    retract=_aspirate_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=15,
                        trailing_air_gap=0.1,
                    ),
                ),
                dispense=_dispense_defaults[1000][50],
            ),
            50: LiquidClassSettings(  # 50uL
                aspirate=AspirateSettings(
                    flow_rate=44.2,
                    delay=0.2,
                    submerge=_aspirate_default_submerge_mm,
                    retract=_aspirate_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=15,
                        trailing_air_gap=0.1,
                    ),
                ),
                dispense=_dispense_defaults[1000][50],
            ),
        },
        200: {  # T200
            5: LiquidClassSettings(  # 5uL
                aspirate=AspirateSettings(
                    flow_rate=20,
                    delay=0.5,
                    submerge=_aspirate_default_submerge_mm,
                    retract=_aspirate_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=10,
                        trailing_air_gap=5,
                    ),
                ),
                dispense=_dispense_defaults[1000][200],
            ),
            50: LiquidClassSettings(  # 50uL
                aspirate=AspirateSettings(
                    flow_rate=37.5,
                    delay=0.5,
                    submerge=_aspirate_default_submerge_mm,
                    retract=_aspirate_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=10,
                        trailing_air_gap=3.5,
                    ),
                ),
                dispense=_dispense_defaults[1000][200],
            ),
            200: LiquidClassSettings(  # 200uL
                aspirate=AspirateSettings(
                    flow_rate=149,
                    delay=0.5,
                    submerge=_aspirate_default_submerge_mm,
                    retract=_aspirate_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=7.7,
                        trailing_air_gap=2,
                    ),
                ),
                dispense=_dispense_defaults[1000][200],
            ),
        },
        1000: {  # T1000
            10: LiquidClassSettings(  # 5uL
                aspirate=AspirateSettings(
                    flow_rate=12.6,
                    delay=0.2,
                    submerge=_aspirate_default_submerge_mm,
                    retract=_aspirate_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=10,
                        trailing_air_gap=10,
                    ),
                ),
                dispense=_dispense_defaults[1000][1000],
            ),
            100: LiquidClassSettings(  # 100uL
                aspirate=AspirateSettings(
                    flow_rate=106,
                    delay=0.2,
                    submerge=_aspirate_default_submerge_mm,
                    retract=_aspirate_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=9.8,
                        trailing_air_gap=10,
                    ),
                ),
                dispense=_dispense_defaults[1000][1000],
            ),
            1000: LiquidClassSettings(  # 1000uL
                aspirate=AspirateSettings(
                    flow_rate=150,
                    delay=0.2,
                    submerge=_aspirate_default_submerge_mm,
                    retract=_aspirate_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=2,
                        trailing_air_gap=10,
                    ),
                ),
                dispense=_dispense_defaults[1000][1000],
            ),
        },
    },
}


def get_liquid_class(
    pipette_volume: int, tip_volume: int, test_volume: int
) -> LiquidClassSettings:
    """Get liquid class."""
    pip_classes = OT3_LIQUID_CLASS[pipette_volume]
    tip_classes = pip_classes[tip_volume]
    return tip_classes[test_volume]


def get_test_volumes(pipette_volume: int, tip_volume: int) -> List[float]:
    pip_classes = OT3_LIQUID_CLASS[pipette_volume]
    tip_classes = pip_classes[tip_volume]
    return list(tip_classes.keys())
