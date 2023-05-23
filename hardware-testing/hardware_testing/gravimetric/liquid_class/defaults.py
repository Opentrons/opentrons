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
_default_submerge_mm_t50 = 1.5
_default_retract_mm = 3.0

# dispense settings are constant across volumes
_dispense_defaults = {
    1: {
        50: {  # P50
            50: DispenseSettings(  # T50
                flow_rate=57,
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
    },
    8: {
        50: {  # P50
            50: DispenseSettings(  # T50
                flow_rate=57,
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
    },
    96: {
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
    },
}

_aspirate_defaults = {
    1: {
        50: {  # P50
            50: {  # T50
                1: AspirateSettings(  # 1uL
                    flow_rate=57,
                    delay=1.0,
                    submerge=_default_submerge_mm_t50,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=3.5,
                        trailing_air_gap=0.1,
                    ),
                ),
                10: AspirateSettings(  # 10uL
                    flow_rate=7.85,
                    delay=1.0,
                    submerge=_default_submerge_mm_t50,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=2.5,
                        trailing_air_gap=0.1,
                    ),
                ),
                50: AspirateSettings(  # 50uL
                    flow_rate=7.85,
                    delay=1.0,
                    submerge=_default_submerge_mm_t50,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=2.5,
                        trailing_air_gap=0.1,
                    ),
                ),
            },
        },
        1000: {  # P1000
            50: {  # T50
                5: AspirateSettings(  # 5uL
                    flow_rate=6.5,
                    delay=1.0,
                    submerge=_default_submerge_mm_t50,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=3.2,
                        trailing_air_gap=0.1,
                    ),
                ),
                10: AspirateSettings(  # 10uL
                    flow_rate=6.5,
                    delay=1.0,
                    submerge=_default_submerge_mm_t50,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=3.2,
                        trailing_air_gap=0.1,
                    ),
                ),
                50: AspirateSettings(  # 50uL
                    flow_rate=6.5,
                    delay=1.0,
                    submerge=_default_submerge_mm_t50,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=3.2,
                        trailing_air_gap=0.1,
                    ),
                ),
            },
            200: {  # T200
                5: AspirateSettings(  # 5uL
                    flow_rate=80,
                    delay=1.0,
                    submerge=_default_submerge_mm,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=16,
                        trailing_air_gap=5,
                    ),
                ),
                50: AspirateSettings(  # 50uL
                    flow_rate=80,
                    delay=1.0,
                    submerge=_default_submerge_mm,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=16,
                        trailing_air_gap=3.5,
                    ),
                ),
                200: AspirateSettings(  # 200uL
                    flow_rate=80,
                    delay=1.0,
                    submerge=_default_submerge_mm,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=16,
                        trailing_air_gap=2,
                    ),
                ),
            },
            1000: {  # T1000
                10: AspirateSettings(  # 10uL
                    flow_rate=160,
                    delay=1.0,
                    submerge=_default_submerge_mm,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=16,
                        trailing_air_gap=10,
                    ),
                ),
                100: AspirateSettings(  # 100uL
                    flow_rate=160,
                    delay=1.0,
                    submerge=_default_submerge_mm,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=16,
                        trailing_air_gap=10,
                    ),
                ),
                1000: AspirateSettings(  # 1000uL
                    flow_rate=160,
                    delay=1.0,
                    submerge=_default_submerge_mm,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=16,
                        trailing_air_gap=10,
                    ),
                ),
            },
        },
    },
    8: {
        50: {  # P50
            50: {  # T50
                1: AspirateSettings(  # 1uL
                    flow_rate=7.85,
                    delay=1.0,
                    submerge=_default_submerge_mm_t50,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=1.5,
                        trailing_air_gap=0.1,
                    ),
                ),
                10: AspirateSettings(  # 10uL
                    flow_rate=7.85,
                    delay=1.0,
                    submerge=_default_submerge_mm_t50,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=2.5,
                        trailing_air_gap=0.1,
                    ),
                ),
                50: AspirateSettings(  # 50uL
                    flow_rate=7.85,
                    delay=1.0,
                    submerge=_default_submerge_mm_t50,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=2.5,
                        trailing_air_gap=0.1,
                    ),
                ),
            },
        },
        1000: {  # P1000
            50: {  # T50
                5: AspirateSettings(  # 5uL
                    flow_rate=6.5,
                    delay=1.0,
                    submerge=_default_submerge_mm_t50,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=3.2,
                        trailing_air_gap=0.1,
                    ),
                ),
                10: AspirateSettings(  # 10uL
                    flow_rate=6.5,
                    delay=1.0,
                    submerge=_default_submerge_mm_t50,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=3.2,
                        trailing_air_gap=0.1,
                    ),
                ),
                50: AspirateSettings(  # 50uL
                    flow_rate=6.5,
                    delay=1.0,
                    submerge=_default_submerge_mm_t50,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=3.2,
                        trailing_air_gap=0.1,
                    ),
                ),
            },
            200: {  # T200
                5: AspirateSettings(  # 5uL
                    flow_rate=80,
                    delay=1.0,
                    submerge=_default_submerge_mm,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=16,
                        trailing_air_gap=5,
                    ),
                ),
                50: AspirateSettings(  # 50uL
                    flow_rate=80,
                    delay=1.0,
                    submerge=_default_submerge_mm,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=16,
                        trailing_air_gap=3.5,
                    ),
                ),
                200: AspirateSettings(  # 200uL
                    flow_rate=80,
                    delay=1.0,
                    submerge=_default_submerge_mm,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=16,
                        trailing_air_gap=2,
                    ),
                ),
            },
            1000: {  # T1000
                10: AspirateSettings(  # 10uL
                    flow_rate=160,
                    delay=1.0,
                    submerge=_default_submerge_mm,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=16,
                        trailing_air_gap=10,
                    ),
                ),
                100: AspirateSettings(  # 100uL
                    flow_rate=160,
                    delay=1.0,
                    submerge=_default_submerge_mm,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=16,
                        trailing_air_gap=10,
                    ),
                ),
                1000: AspirateSettings(  # 1000uL
                    flow_rate=160,
                    delay=1.0,
                    submerge=_default_submerge_mm,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=16,
                        trailing_air_gap=10,
                    ),
                ),
            },
        },
    },
    96: {
        1000: {  # P1000
            50: {  # T50
                5: AspirateSettings(  # 5uL
                    flow_rate=6.5,
                    delay=1.0,
                    submerge=_default_submerge_mm_t50,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=3.2,
                        trailing_air_gap=0.1,
                    ),
                ),
                10: AspirateSettings(  # 10uL
                    flow_rate=6.5,
                    delay=1.0,
                    submerge=_default_submerge_mm_t50,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=3.2,
                        trailing_air_gap=0.1,
                    ),
                ),
                50: AspirateSettings(  # 50uL
                    flow_rate=6.5,
                    delay=1.0,
                    submerge=_default_submerge_mm_t50,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=3.2,
                        trailing_air_gap=0.1,
                    ),
                ),
            },
            200: {  # T200
                5: AspirateSettings(  # 5uL
                    flow_rate=80,
                    delay=1.0,
                    submerge=_default_submerge_mm,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=16,
                        trailing_air_gap=5,
                    ),
                ),
                50: AspirateSettings(  # 50uL
                    flow_rate=80,
                    delay=1.0,
                    submerge=_default_submerge_mm,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=16,
                        trailing_air_gap=3.5,
                    ),
                ),
                200: AspirateSettings(  # 200uL
                    flow_rate=80,
                    delay=1.0,
                    submerge=_default_submerge_mm,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=16,
                        trailing_air_gap=2,
                    ),
                ),
            },
            1000: {  # T1000
                10: AspirateSettings(  # 10uL
                    flow_rate=160,
                    delay=1.0,
                    submerge=_default_submerge_mm,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=16,
                        trailing_air_gap=10,
                    ),
                ),
                100: AspirateSettings(  # 100uL
                    flow_rate=160,
                    delay=1.0,
                    submerge=_default_submerge_mm,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=16,
                        trailing_air_gap=10,
                    ),
                ),
                1000: AspirateSettings(  # 1000uL
                    flow_rate=160,
                    delay=1.0,
                    submerge=_default_submerge_mm,
                    retract=_default_retract_mm,
                    air_gap=AirGapSettings(
                        leading_air_gap=16,
                        trailing_air_gap=10,
                    ),
                ),
            },
        },
    },
}


def get_liquid_class(
    pipette: int, channels: int, tip: int, volume: int
) -> LiquidClassSettings:
    """Get liquid class."""
    aspirate_cls_per_volume = _aspirate_defaults[channels][pipette][tip]
    dispense_cls = _dispense_defaults[channels][pipette][tip]
    defined_volumes = list(aspirate_cls_per_volume.keys())
    defined_volumes.sort()
    assert len(defined_volumes) == 3

    def _build_liquid_class(vol: int) -> LiquidClassSettings:
        return LiquidClassSettings(
            aspirate=aspirate_cls_per_volume[vol],
            dispense=dispense_cls,
        )

    def _get_interp_liq_class(lower_ul: int, upper_ul: int) -> LiquidClassSettings:
        factor = (volume - lower_ul) / (upper_ul - lower_ul)
        lower_cls = _build_liquid_class(lower_ul)
        upper_cls = _build_liquid_class(upper_ul)
        return interpolate(lower_cls, upper_cls, factor)

    if volume <= defined_volumes[0]:
        return _build_liquid_class(defined_volumes[0])
    elif volume < defined_volumes[1]:
        return _get_interp_liq_class(defined_volumes[0], defined_volumes[1])
    elif volume == defined_volumes[1]:
        return _build_liquid_class(defined_volumes[1])
    elif volume < defined_volumes[2]:
        return _get_interp_liq_class(defined_volumes[1], defined_volumes[2])
    else:
        return _build_liquid_class(defined_volumes[2])


def get_test_volumes(pipette: int, channels: int, tip: int) -> List[float]:
    """Get test volumes."""
    aspirate_cls_per_volume = _aspirate_defaults[channels][pipette][tip]
    defined_volumes = list(aspirate_cls_per_volume.keys())
    return [float(v) for v in defined_volumes]
