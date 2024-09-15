"""Defaults."""
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
        plunger_flow_rate=None,
        trailing_air_gap=None,
        z_submerge_depth=1.5,
        z_retract_height=5.0,
        delay=1.0,
    ),
    _GLYCEROL_50: AspirateSettings(
        plunger_flow_rate=None,
        trailing_air_gap=None,
        z_submerge_depth=1.5,
        z_retract_height=5.0,
        delay=1.0,
    ),
    _ETHANOL_70: AspirateSettings(
        plunger_flow_rate=None,
        trailing_air_gap=None,
        z_submerge_depth=1.5,
        z_retract_height=5.0,
        delay=1.0,
    ),
}
_default_dispense: Dict[str, DispenseSettings] = {
    _WATER: DispenseSettings(
        plunger_flow_rate=None,
        blow_out_submerged=None,
        z_submerge_depth=1.5,
        z_retract_height=5.0,
        delay=0.5,
    ),
    _GLYCEROL_50: DispenseSettings(
        plunger_flow_rate=None,
        blow_out_submerged=None,
        z_submerge_depth=1.5,
        z_retract_height=5.0,
        delay=0.5,
    ),
    _ETHANOL_70: DispenseSettings(
        plunger_flow_rate=None,
        blow_out_submerged=None,
        z_submerge_depth=1.5,
        z_retract_height=5.0,
        delay=0.5,
    ),
}

_aspirate_defaults: Dict[
    int, Dict[int, Dict[int, Dict[int, Dict[str, AspirateSettings]]]]
] = {
    50: {  # T50
        50: {  # P50
            1: {  # 1CH
                1: {  # 1uL
                    _WATER: AspirateSettings(  # water
                        plunger_flow_rate=35,
                        trailing_air_gap=0.1,
                        z_submerge_depth=None,
                        z_retract_height=None,
                        delay=None,
                    ),
                    _GLYCEROL_50: AspirateSettings(  # glycerol 50%
                        plunger_flow_rate=35,
                        trailing_air_gap=0.1,
                        z_submerge_depth=None,
                        z_retract_height=None,
                        delay=None,
                    ),
                    _ETHANOL_70: AspirateSettings(  # ethanol 70%
                        plunger_flow_rate=35,
                        trailing_air_gap=0.1,
                        z_submerge_depth=None,
                        z_retract_height=None,
                        delay=None,
                    ),
                },
                10: {  # 1uL
                    _WATER: AspirateSettings(  # water
                        plunger_flow_rate=35,
                        trailing_air_gap=0.1,
                        z_submerge_depth=None,
                        z_retract_height=None,
                        delay=None,
                    ),
                    _GLYCEROL_50: AspirateSettings(  # glycerol 50%
                        plunger_flow_rate=35,
                        trailing_air_gap=0.1,
                        z_submerge_depth=None,
                        z_retract_height=None,
                        delay=None,
                    ),
                    _ETHANOL_70: AspirateSettings(  # ethanol 70%
                        plunger_flow_rate=35,
                        trailing_air_gap=0.1,
                        z_submerge_depth=None,
                        z_retract_height=None,
                        delay=None,
                    ),
                },
                50: {  # 1uL
                    _WATER: AspirateSettings(  # water
                        plunger_flow_rate=35,
                        trailing_air_gap=0.1,
                        z_submerge_depth=None,
                        z_retract_height=None,
                        delay=None,
                    ),
                    _GLYCEROL_50: AspirateSettings(  # glycerol 50%
                        plunger_flow_rate=35,
                        trailing_air_gap=0.1,
                        z_submerge_depth=None,
                        z_retract_height=None,
                        delay=None,
                    ),
                    _ETHANOL_70: AspirateSettings(  # ethanol 70%
                        plunger_flow_rate=35,
                        trailing_air_gap=0.1,
                        z_submerge_depth=None,
                        z_retract_height=None,
                        delay=None,
                    ),
                },
            },
        },
    },
}

_dispense_defaults: Dict[
    int, Dict[int, Dict[int, Dict[int, Dict[str, DispenseSettings]]]]
] = {
    50: {  # T50
        50: {  # P50
            1: {  # 1CH
                1: {  # 1uL
                    _WATER: DispenseSettings(  # water
                        plunger_flow_rate=57,
                        blow_out_submerged=7,
                        z_submerge_depth=None,
                        z_retract_height=None,
                        delay=None,
                    ),
                    _GLYCEROL_50: DispenseSettings(  # glycerol 50%
                        plunger_flow_rate=57,
                        blow_out_submerged=7,
                        z_submerge_depth=None,
                        z_retract_height=None,
                        delay=None,
                    ),
                    _ETHANOL_70: DispenseSettings(  # ethanol 70%
                        plunger_flow_rate=57,
                        blow_out_submerged=7,
                        z_submerge_depth=None,
                        z_retract_height=None,
                        delay=None,
                    ),
                },
                10: {  # 1uL
                    _WATER: DispenseSettings(  # water
                        plunger_flow_rate=57,
                        blow_out_submerged=7,
                        z_submerge_depth=None,
                        z_retract_height=None,
                        delay=None,
                    ),
                    _GLYCEROL_50: DispenseSettings(  # glycerol 50%
                        plunger_flow_rate=57,
                        blow_out_submerged=7,
                        z_submerge_depth=None,
                        z_retract_height=None,
                        delay=None,
                    ),
                    _ETHANOL_70: DispenseSettings(  # ethanol 70%
                        plunger_flow_rate=57,
                        blow_out_submerged=7,
                        z_submerge_depth=None,
                        z_retract_height=None,
                        delay=None,
                    ),
                },
                50: {  # 1uL
                    _WATER: DispenseSettings(  # water
                        plunger_flow_rate=57,
                        blow_out_submerged=7,
                        z_submerge_depth=None,
                        z_retract_height=None,
                        delay=None,
                    ),
                    _GLYCEROL_50: DispenseSettings(  # glycerol 50%
                        plunger_flow_rate=57,
                        blow_out_submerged=7,
                        z_submerge_depth=None,
                        z_retract_height=None,
                        delay=None,
                    ),
                    _ETHANOL_70: DispenseSettings(  # ethanol 70%
                        plunger_flow_rate=57,
                        blow_out_submerged=7,
                        z_submerge_depth=None,
                        z_retract_height=None,
                        delay=None,
                    ),
                },
            },
        },
    },
}


def get_liquid_class(
    liquid: str, dilution: float, pipette: int, channels: int, tip: int, volume: int
) -> LiquidClassSettings:
    """Get liquid class."""
    aspirate_cls_per_volume = _aspirate_defaults[tip][pipette][channels]
    dispense_cls_per_volume = _dispense_defaults[tip][pipette][channels]
    defined_volumes = list(aspirate_cls_per_volume.keys())
    defined_volumes.sort()
    assert len(defined_volumes) == 3

    def _build_liquid_class(vol: int) -> LiquidClassSettings:
        cls_name = SupportedLiquid.from_string(liquid).name_with_dilution(dilution)
        asp_cls = aspirate_cls_per_volume[vol][cls_name]
        for f in fields(asp_cls):
            if getattr(asp_cls, f.name) is None:
                setattr(asp_cls, f.name, getattr(_default_aspirate[cls_name], f.name))
        dsp_cls = dispense_cls_per_volume[vol][cls_name]
        for f in fields(dsp_cls):
            if getattr(dsp_cls, f.name) is None:
                setattr(dsp_cls, f.name, getattr(_default_dispense[cls_name], f.name))
        return LiquidClassSettings(
            aspirate=asp_cls,
            dispense=dsp_cls,
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
