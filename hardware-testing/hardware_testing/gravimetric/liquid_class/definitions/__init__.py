from typing import Dict
from opentrons.types import Point
from .. import liquid_class_settings as lcs
from . import water


default = lcs.LiquidClassSettings(
    submerge=lcs.SubmergeSettings(
        position=lcs.PositionSettings(
            offset=Point(x=0, y=0, z=2),
            ref="well-top",
        ),
        speed=30.0,
        delay=0.0,
        lld_enabled=False,
    ),
    retract=lcs.RetractSettings(
        position=lcs.PositionSettings(
            offset=Point(x=0, y=0, z=-1.5),
            ref="meniscus",
        ),
        speed=50,
        delay=1.0,
        air_gap=0.1,
        blow_out=lcs.BlowOutSettings(
            enabled=True,
            position=lcs.PositionSettings(
                offset=Point(x=0, y=0, z=5.0),
                ref="meniscus",
            ),
        ),
        touch_tip=lcs.TouchTipSettings(
            enabled=False,
            position=lcs.PositionSettings(
                offset=Point(x=0, y=0, z=-2.0),
                ref="well-top",
            ),
            speed=30,
            mm_to_edge=1.0,
        ),
    ),
    aspirate=lcs.AspirateSettings(
        order=[],
        position=lcs.PositionSettings(
            offset=Point(x=0, y=0, z=-1.5),
            ref="meniscus",
        ),
        flow_rate=30.0,
        delay=0.5,
        mix=lcs.MixSettings(
            enabled=False,
            count=0,
            volume=None,
        ),
        conditioning_volume=0.0,
        disposal_volume=0.0,
    ),
    dispense=lcs.DispenseSettings(
        order=[],
        position=lcs.PositionSettings(
            offset=Point(x=0, y=0, z=-1.5),
            ref="meniscus",
        ),
        flow_rate=30.0,
        delay=1.0,
        mix=lcs.MixSettings(
            enabled=False,
            count=0,
            volume=None,
        ),
        push_out=7.0,
    ),
)


_all_classes: Dict[
    str, Dict[str, Dict[str, Dict[str, Dict[int, lcs.LiquidClassSettings]]]]
] = {
    "water": {
        "t50": {
            "p50": {
                "1ch": water.t50.p50.single_channel.VOLUMES,
                "8ch": water.t50.p50.eight_channel.VOLUMES,
            },
            "p1000": {
                "1ch": water.t50.p1000.single_channel.VOLUMES,
                "8ch": water.t50.p1000.eight_channel.VOLUMES,
                "96ch": water.t50.p1000.ninety_six_channel.VOLUMES,
            },
        },
    },
}


def get_liquid_class(
    liquid: str, dilution: float, pipette: int, channels: int, tip: int, volume: int
) -> lcs.LiquidClassSettings:
    """Get liquid class."""
    dil_str = "" if not dilution or dilution == 1.0 else f"-{int(dilution * 100)}"
    cls_per_volume = _all_classes[f"{liquid}{dil_str}"][f"t{tip}"][f"p{pipette}"][
        f"{channels}ch"
    ]
    defined_volumes = list(cls_per_volume.keys())
    defined_volumes.sort()
    assert len(defined_volumes) == 3

    def _get_interp_liq_class(lower_ul: int, upper_ul: int) -> lcs.LiquidClassSettings:
        lower_cls = cls_per_volume[lower_ul]
        upper_cls = cls_per_volume[upper_ul]
        return lcs.LiquidClassSettings.interpolate(
            volume, lower_ul, upper_ul, lower_cls, upper_cls
        )

    # FIXME: this assumes there is 3x volumes defined for every class
    #        if we have more or less, this will break
    if volume <= defined_volumes[0]:
        return cls_per_volume[defined_volumes[0]]
    elif volume < defined_volumes[1]:
        return _get_interp_liq_class(defined_volumes[0], defined_volumes[1])
    elif volume == defined_volumes[1]:
        return cls_per_volume[defined_volumes[1]]
    elif volume < defined_volumes[2]:
        return _get_interp_liq_class(defined_volumes[1], defined_volumes[2])
    else:
        return cls_per_volume[defined_volumes[2]]


__all__ = [
    "get_liquid_class",
]
