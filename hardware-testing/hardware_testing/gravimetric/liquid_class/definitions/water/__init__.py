from opentrons.types import Point
from ... import liquid_class_settings as lcs
from .. import default as _default
from . import t50, t200, t1000


default = lcs.LiquidClassSettings(
    submerge=lcs.SubmergeSettings(
        position=lcs.PositionSettings(
            offset=Point(
                x=_default.submerge.position.offset.x,
                y=_default.submerge.position.offset.y,
                z=_default.submerge.position.offset.z,
            ),
            ref=_default.submerge.position.ref,
        ),
        speed=_default.submerge.speed,
        delay=_default.submerge.delay,
        lld_enabled=_default.submerge.lld_enabled,
    ),
    retract=lcs.RetractSettings(
        position=lcs.PositionSettings(
            offset=Point(
                x=_default.retract.position.offset.x,
                y=_default.retract.position.offset.y,
                z=_default.retract.position.offset.z,
            ),
            ref=_default.retract.position.ref,
        ),
        speed=_default.retract.speed,
        delay=_default.retract.delay,
        air_gap=_default.retract.air_gap,
        blow_out=lcs.BlowOutSettings(
            enabled=_default.retract.blow_out.enabled,
            position=lcs.PositionSettings(
                offset=Point(
                    x=_default.retract.blow_out.position.offset.x,
                    y=_default.retract.blow_out.position.offset.y,
                    z=_default.retract.blow_out.position.offset.z,
                ),
                ref=_default.retract.blow_out.position.ref,
            ),
        ),
        touch_tip=lcs.TouchTipSettings(
            enabled=_default.retract.touch_tip.enabled,
            position=lcs.PositionSettings(
                offset=Point(
                    x=_default.retract.touch_tip.position.offset.x,
                    y=_default.retract.touch_tip.position.offset.y,
                    z=_default.retract.touch_tip.position.offset.z,
                ),
                ref=_default.retract.touch_tip.position.ref,
            ),
            speed=_default.retract.touch_tip.speed,
            mm_to_edge=_default.retract.touch_tip.mm_to_edge,
        ),
    ),
    aspirate=lcs.AspirateSettings(
        order=_default.aspirate.order,
        position=lcs.PositionSettings(
            offset=Point(
                x=_default.aspirate.position.offset.x,
                y=_default.aspirate.position.offset.y,
                z=_default.aspirate.position.offset.z,
            ),
            ref=_default.aspirate.position.ref,
        ),
        flow_rate=_default.aspirate.flow_rate,
        delay=_default.aspirate.delay,
        mix=lcs.MixSettings(
            enabled=_default.aspirate.mix.enabled,
            count=_default.aspirate.mix.count,
            volume=_default.aspirate.mix.volume,
        ),
        conditioning_volume=_default.aspirate.conditioning_volume,
        disposal_volume=_default.aspirate.disposal_volume,
    ),
    dispense=lcs.DispenseSettings(
        order=_default.dispense.order,
        position=lcs.PositionSettings(
            offset=Point(
                x=_default.dispense.position.offset.x,
                y=_default.dispense.position.offset.y,
                z=_default.dispense.position.offset.z,
            ),
            ref=_default.dispense.position.ref,
        ),
        flow_rate=_default.dispense.flow_rate,
        delay=_default.dispense.delay,
        mix=lcs.MixSettings(
            enabled=_default.dispense.mix.enabled,
            count=_default.dispense.mix.count,
            volume=_default.dispense.mix.volume,
        ),
        push_out=_default.dispense.push_out,
    ),
)

__all__ = [
    "default",
    "t50",
    "t200",
    "t1000",
]
