"""Defaults."""
from copy import deepcopy
from dataclasses import fields
from typing import Dict

from .definition import (
    LiquidClassSettings,
    AspirateSettings,
    DispenseSettings,
    interpolate,
)
from ..measurement import SupportedLiquid


_WATER = SupportedLiquid.WATER.name
_GLYCEROL_50 = SupportedLiquid.GLYCEROL.name_with_dilution(0.5)
_ETHANOL_70 = SupportedLiquid.ETHANOL.name_with_dilution(0.7)

_default_aspirate: Dict[str, AspirateSettings] = {
    _WATER: AspirateSettings(
        z_speed=50,
        flow_rate=None,
        air_gap=None,
        submerge_mm=-1.5,
        retract_mm=3.0,
        delay=1.0,
    ),
    _GLYCEROL_50: AspirateSettings(
        z_speed=50,
        flow_rate=None,
        air_gap=None,
        submerge_mm=-1.5,
        retract_mm=3.0,
        delay=1.5,  # 1.0 second was barely enough time (b/c viscosity)
    ),
    _ETHANOL_70: AspirateSettings(
        z_speed=50,
        flow_rate=None,
        air_gap=None,
        submerge_mm=-1.5,
        retract_mm=3.0,
        delay=1.0,
    ),
}
_default_dispense: Dict[str, DispenseSettings] = {
    _WATER: DispenseSettings(
        z_speed=50,
        flow_rate=None,
        push_out=None,
        submerge_mm=-1.5,  # contact dispense
        retract_mm=3.0,
        delay=0.5,
    ),
    _GLYCEROL_50: DispenseSettings(
        z_speed=50,
        flow_rate=None,
        push_out=None,
        submerge_mm=-1.5,  # contact dispense
        retract_mm=3.0,
        delay=0.5,
    ),
    _ETHANOL_70: DispenseSettings(
        z_speed=50,
        flow_rate=None,
        push_out=None,
        submerge_mm=-1.5,  # contact dispense
        retract_mm=3.0,
        delay=0.5,
    ),
}
_default_volume_correction: Dict[str, str] = {
    _WATER: "1",
    _GLYCEROL_50: "1",  # FIXME: only exists for P50S right now
    _ETHANOL_70: "1",  # FIXME: doesn't exist yet
}

_defaults: Dict[
    int, Dict[int, Dict[int, Dict[int, Dict[str, LiquidClassSettings]]]]
] = {
    50: {  # T50
        50: {  # P50
            1: {  # 1CH
                1: {  # 1uL
                    _WATER: LiquidClassSettings(  # water
                        aspirate=AspirateSettings(
                            z_speed=None,
                            flow_rate=35,
                            air_gap=0.0,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        dispense=DispenseSettings(
                            z_speed=None,
                            flow_rate=57,
                            push_out=11,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        volume_correction_version=None,
                    ),
                    _GLYCEROL_50: LiquidClassSettings(  # glycerol-50
                        aspirate=AspirateSettings(
                            z_speed=None,
                            flow_rate=7.0,
                            air_gap=0.0,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        dispense=DispenseSettings(
                            z_speed=None,
                            flow_rate=40.0,
                            push_out=11.0,  # NOTE: Tecan is 40uL
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        volume_correction_version=None,
                    ),
                },
                10: {  # 10uL
                    _WATER: LiquidClassSettings(  # water
                        aspirate=AspirateSettings(
                            z_speed=None,
                            flow_rate=23.5,
                            air_gap=0.0,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        dispense=DispenseSettings(
                            z_speed=None,
                            flow_rate=57,
                            push_out=11,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        volume_correction_version=None,
                    ),
                    _GLYCEROL_50: LiquidClassSettings(  # glycerol-50
                        aspirate=AspirateSettings(
                            z_speed=None,
                            flow_rate=10.0,
                            air_gap=0.0,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        dispense=DispenseSettings(
                            z_speed=None,
                            flow_rate=40.0,
                            push_out=11,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        volume_correction_version=None,
                    ),
                },
                50: {  # 50uL
                    _WATER: LiquidClassSettings(  # water
                        aspirate=AspirateSettings(
                            z_speed=None,
                            flow_rate=35,
                            air_gap=0.0,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        dispense=DispenseSettings(
                            z_speed=None,
                            flow_rate=57,
                            push_out=11,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        volume_correction_version=None,
                    ),
                    _GLYCEROL_50: LiquidClassSettings(  # glycerol-50
                        aspirate=AspirateSettings(
                            z_speed=None,
                            flow_rate=40.0,
                            air_gap=0.0,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        dispense=DispenseSettings(
                            z_speed=None,
                            flow_rate=40.0,
                            push_out=11,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        volume_correction_version=None,
                    ),
                },
            },
        },
        1000: {  # P1000
            1: {  # 1CH
                5: {  # 5uL
                    _WATER: LiquidClassSettings(  # water
                        aspirate=AspirateSettings(
                            z_speed=None,
                            flow_rate=318,
                            air_gap=0.0,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        dispense=DispenseSettings(
                            z_speed=None,
                            flow_rate=318,
                            push_out=5,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        volume_correction_version=None,
                    ),
                    _GLYCEROL_50: LiquidClassSettings(  # glycerol-50
                        aspirate=AspirateSettings(
                            z_speed=None,
                            flow_rate=8.0,
                            air_gap=0.0,  # ~3.1uL and it "slides" up during retract
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        dispense=DispenseSettings(
                            z_speed=None,
                            flow_rate=600.0,
                            push_out=8.0,  # 8uL is minimum (and best performer?)
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        volume_correction_version=None,
                    ),
                },
                10: {  # 10uL
                    _WATER: LiquidClassSettings(  # water
                        aspirate=AspirateSettings(
                            z_speed=None,
                            flow_rate=478,
                            air_gap=0.0,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        dispense=DispenseSettings(
                            z_speed=None,
                            flow_rate=478,
                            push_out=5,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        volume_correction_version=None,
                    ),
                    _GLYCEROL_50: LiquidClassSettings(  # glycerol-50
                        aspirate=AspirateSettings(
                            z_speed=None,
                            flow_rate=10.0,
                            air_gap=0.0,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        dispense=DispenseSettings(
                            z_speed=None,
                            flow_rate=600.0,
                            push_out=30.0,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        volume_correction_version=None,
                    ),
                },
                50: {  # 50uL
                    _WATER: LiquidClassSettings(  # water
                        aspirate=AspirateSettings(
                            z_speed=None,
                            flow_rate=478,
                            air_gap=0.0,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        dispense=DispenseSettings(
                            z_speed=None,
                            flow_rate=57,
                            push_out=5,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        volume_correction_version=None,
                    ),
                    _GLYCEROL_50: LiquidClassSettings(  # glycerol-50
                        aspirate=AspirateSettings(
                            z_speed=None,
                            flow_rate=40.0,
                            air_gap=0.0,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        dispense=DispenseSettings(
                            z_speed=None,
                            flow_rate=600.0,
                            push_out=20.0,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        volume_correction_version=None,
                    ),
                },
            },
        },
    },
    200: {  # T200
        1000: {  # P1000
            1: {  # 1CH
                5: {  # 5uL
                    _WATER: LiquidClassSettings(  # water
                        aspirate=AspirateSettings(
                            z_speed=None,
                            flow_rate=716,
                            air_gap=0,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        dispense=DispenseSettings(
                            z_speed=None,
                            flow_rate=716,
                            push_out=5,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        volume_correction_version=None,
                    ),
                    _GLYCEROL_50: LiquidClassSettings(  # glycerol-50
                        aspirate=AspirateSettings(
                            z_speed=None,
                            flow_rate=11.0,
                            air_gap=0.0,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        dispense=DispenseSettings(
                            z_speed=None,
                            flow_rate=500.0,
                            push_out=20.0,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        volume_correction_version=None,
                    ),
                },
                50: {  # 50uL
                    _WATER: LiquidClassSettings(  # water
                        aspirate=AspirateSettings(
                            z_speed=None,
                            flow_rate=716,
                            air_gap=0,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        dispense=DispenseSettings(
                            z_speed=None,
                            flow_rate=716,
                            push_out=5,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        volume_correction_version=None,
                    ),
                    _GLYCEROL_50: LiquidClassSettings(  # glycerol-50
                        aspirate=AspirateSettings(
                            z_speed=None,
                            flow_rate=40.0,
                            air_gap=0.0,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        dispense=DispenseSettings(
                            z_speed=None,
                            flow_rate=500.0,
                            push_out=11.0,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        volume_correction_version=None,
                    ),
                },
                200: {  # 200uL
                    _WATER: LiquidClassSettings(  # water
                        aspirate=AspirateSettings(
                            z_speed=None,
                            flow_rate=716,
                            air_gap=0,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        dispense=DispenseSettings(
                            z_speed=None,
                            flow_rate=716,
                            push_out=5,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        volume_correction_version=None,
                    ),
                    _GLYCEROL_50: LiquidClassSettings(  # glycerol-50
                        aspirate=AspirateSettings(
                            z_speed=None,
                            flow_rate=150.0,
                            air_gap=0.0,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        dispense=DispenseSettings(
                            z_speed=None,
                            flow_rate=500.0,
                            push_out=11.0,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        volume_correction_version=None,
                    ),
                },
            },
        },
    },
    1000: {  # T1000
        1000: {  # P1000
            1: {  # 1CH
                10: {  # 10uL
                    _WATER: LiquidClassSettings(  # water
                        aspirate=AspirateSettings(
                            z_speed=None,
                            flow_rate=160,
                            air_gap=0,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        dispense=DispenseSettings(
                            z_speed=None,
                            flow_rate=160,
                            push_out=20,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        volume_correction_version=None,
                    ),
                    _GLYCEROL_50: LiquidClassSettings(  # glycerol-50
                        aspirate=AspirateSettings(
                            z_speed=None,
                            flow_rate=15.0,
                            air_gap=0.0,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        dispense=DispenseSettings(
                            z_speed=None,
                            flow_rate=600,
                            push_out=30.0,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        volume_correction_version=None,
                    ),
                },
                100: {  # 100uL
                    _WATER: LiquidClassSettings(  # water
                        aspirate=AspirateSettings(
                            z_speed=None,
                            flow_rate=716,
                            air_gap=0,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        dispense=DispenseSettings(
                            z_speed=None,
                            flow_rate=716,
                            push_out=20,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        volume_correction_version=None,
                    ),
                    _GLYCEROL_50: LiquidClassSettings(  # glycerol-50
                        aspirate=AspirateSettings(
                            z_speed=None,
                            flow_rate=100.0,
                            air_gap=0.0,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        dispense=DispenseSettings(
                            z_speed=None,
                            flow_rate=600,
                            push_out=20.0,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        volume_correction_version=None,
                    ),
                },
                1000: {  # 1000uL
                    _WATER: LiquidClassSettings(  # water
                        aspirate=AspirateSettings(
                            z_speed=None,
                            flow_rate=716,
                            air_gap=0,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        dispense=DispenseSettings(
                            z_speed=None,
                            flow_rate=716,
                            push_out=20,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        volume_correction_version=None,
                    ),
                    _GLYCEROL_50: LiquidClassSettings(  # glycerol-50
                        aspirate=AspirateSettings(
                            z_speed=None,
                            flow_rate=150.0,
                            air_gap=0.0,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        dispense=DispenseSettings(
                            z_speed=None,
                            flow_rate=600,
                            push_out=11.0,
                            submerge_mm=None,
                            retract_mm=None,
                            delay=None,
                        ),
                        volume_correction_version=None,
                    ),
                },
            },
        },
    },
}


def get_default(liquid: str, dilution: float) -> LiquidClassSettings:
    cls_name = SupportedLiquid.from_string(liquid).name_with_dilution(dilution)
    return LiquidClassSettings(
        aspirate=deepcopy(_default_aspirate[cls_name]),
        dispense=deepcopy(_default_dispense[cls_name]),
        volume_correction_version=str(_default_volume_correction[cls_name]),
    )


def get_liquid_class(
    liquid: str, dilution: float, pipette: int, channels: int, tip: int, volume: int
) -> LiquidClassSettings:
    """Get liquid class."""
    cls_name = SupportedLiquid.from_string(liquid).name_with_dilution(dilution)
    _cls_per_volume = _defaults[tip][pipette][channels]
    defined_volumes = list(_cls_per_volume.keys())
    defined_volumes.sort()
    assert len(defined_volumes) == 3

    def _build_liquid_class(vol: int) -> LiquidClassSettings:
        _cls = deepcopy(_cls_per_volume[vol][cls_name])
        for f in fields(_cls.aspirate):
            if getattr(_cls.aspirate, f.name) is None:
                setattr(
                    _cls.aspirate, f.name, getattr(_default_aspirate[cls_name], f.name)
                )
        for f in fields(_cls.dispense):
            if getattr(_cls.dispense, f.name) is None:
                setattr(
                    _cls.dispense, f.name, getattr(_default_dispense[cls_name], f.name)
                )
        return _cls

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
