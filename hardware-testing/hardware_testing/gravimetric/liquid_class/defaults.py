"""Defaults."""
from typing import List

from .definition import (
    LiquidClassSettings,
    AspirateSettings,
    DispenseSettings,
    AirGapSettings,
    interpolate,
)

# submerge/retract Z distances
_default_submerge_mm = 1.5
_default_submerge_mm_t50 = 0.5
_default_retract_mm = 3.0

# dispense settings are constant across volumes
_dispense_defaults = {
    50: {  # P50
        50: DispenseSettings(  # T50
            flow_rate=7.85,
            delay=0.5,
            submerge=_default_submerge_mm_t50,
            retract=_default_retract_mm,
            acceleration=40000,  # this is a fake number
            deceleration=40000,  # this is a fake number
        ),
    },
    1000: {  # P1000
        50: DispenseSettings(  # T50
            flow_rate=160,
            delay=0.5,
            submerge=_default_submerge_mm_t50,
            retract=_default_retract_mm,
            acceleration=10000,  # this is a fake number
            deceleration=20000,  # this is a fake number
        ),
        200: DispenseSettings(  # T200
            flow_rate=160,
            delay=0.5,
            submerge=_default_submerge_mm,
            retract=_default_retract_mm,
            acceleration=10000,  # this is a fake number
            deceleration=20000,  # this is a fake number
        ),
        1000: DispenseSettings(  # T1000
            flow_rate=160,
            delay=0.5,
            submerge=_default_submerge_mm,
            retract=_default_retract_mm,
            acceleration=10000,
            deceleration=20000,
        ),
    },
}

OT3_LIQUID_CLASS = {
    50: {  # P50
        50: {  # T50
            1: LiquidClassSettings(  # 1uL
                aspirate=AspirateSettings(
                    flow_rate=7.85,
                    delay=1.0,
                    submerge=_default_submerge_mm_t50,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=2.5,
                        trailing_air_gap=0.1,
                    ),
                ),
                dispense=_dispense_defaults[50][50],
            ),
            10: LiquidClassSettings(  # 10uL
                aspirate=AspirateSettings(
                    flow_rate=7.85,
                    delay=1.0,
                    submerge=_default_submerge_mm_t50,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=2.5,
                        trailing_air_gap=0.1,
                    ),
                ),
                dispense=_dispense_defaults[50][50],
            ),
            50: LiquidClassSettings(  # 50uL
                aspirate=AspirateSettings(
                    flow_rate=7.85,
                    delay=1.0,
                    submerge=_default_submerge_mm_t50,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=2.5,
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
                    flow_rate=6.5,
                    delay=1.0,
                    submerge=_default_submerge_mm_t50,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=3.2,
                        trailing_air_gap=0.1,
                    ),
                ),
                dispense=_dispense_defaults[1000][50],
            ),
            10: LiquidClassSettings(  # 10uL
                aspirate=AspirateSettings(
                    flow_rate=6.5,
                    delay=1.0,
                    submerge=_default_submerge_mm_t50,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=3.2,
                        trailing_air_gap=0.1,
                    ),
                ),
                dispense=_dispense_defaults[1000][50],
            ),
            50: LiquidClassSettings(  # 50uL
                aspirate=AspirateSettings(
                    flow_rate=6.5,
                    delay=1.0,
                    submerge=_default_submerge_mm_t50,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=3.2,
                        trailing_air_gap=0.1,
                    ),
                ),
                dispense=_dispense_defaults[1000][50],
            ),
        },
        200: {  # T200
            5: LiquidClassSettings(  # 5uL
                aspirate=AspirateSettings(
                    flow_rate=80,
                    delay=1.0,
                    submerge=_default_submerge_mm,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=16,
                        trailing_air_gap=5,
                    ),
                ),
                dispense=_dispense_defaults[1000][200],
            ),
            50: LiquidClassSettings(  # 50uL
                aspirate=AspirateSettings(
                    flow_rate=80,
                    delay=1.0,
                    submerge=_default_submerge_mm,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=16,
                        trailing_air_gap=3.5,
                    ),
                ),
                dispense=_dispense_defaults[1000][200],
            ),
            200: LiquidClassSettings(  # 200uL
                aspirate=AspirateSettings(
                    flow_rate=80,
                    delay=1.0,
                    submerge=_default_submerge_mm,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=16,
                        trailing_air_gap=2,
                    ),
                ),
                dispense=_dispense_defaults[1000][200],
            ),
        },
        1000: {  # T1000
            10: LiquidClassSettings(  # 10uL
                aspirate=AspirateSettings(
                    flow_rate=160,
                    delay=1.0,
                    submerge=_default_submerge_mm,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=16,
                        trailing_air_gap=10,
                    ),
                ),
                dispense=_dispense_defaults[1000][1000],
            ),
            100: LiquidClassSettings(  # 100uL
                aspirate=AspirateSettings(
                    flow_rate=160,
                    delay=1.0,
                    submerge=_default_submerge_mm,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=16,
                        trailing_air_gap=10,
                    ),
                ),
                dispense=_dispense_defaults[1000][1000],
            ),
            1000: LiquidClassSettings(  # 1000uL
                aspirate=AspirateSettings(
                    flow_rate=160,
                    delay=1.0,
                    submerge=_default_submerge_mm,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=16,
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
    defined_volumes = list(tip_classes.keys())
    defined_volumes.sort()
    assert len(defined_volumes) == 3

    def _get_interp_liq_class(lower: int, upper: int) -> LiquidClassSettings:
        factor = (test_volume - lower) / (upper - lower)
        return interpolate(tip_classes[lower], tip_classes[upper], factor)

    if test_volume <= defined_volumes[0]:
        return tip_classes[defined_volumes[0]]
    elif test_volume < defined_volumes[1]:
        return _get_interp_liq_class(defined_volumes[0], defined_volumes[1])
    elif test_volume == defined_volumes[1]:
        return tip_classes[defined_volumes[1]]
    elif test_volume < defined_volumes[2]:
        return _get_interp_liq_class(defined_volumes[1], defined_volumes[2])
    else:
        return tip_classes[defined_volumes[2]]


def get_test_volumes(pipette_volume: int, tip_volume: int) -> List[float]:
    """Get test volumes."""
    pip_classes = OT3_LIQUID_CLASS[pipette_volume]
    tip_classes = pip_classes[tip_volume]
    return list(tip_classes.keys())
