from ....liquid_class_settings import *
from .. import default as _default
from . import p1000, p50


default = Liquid(
    submerge=Submerge(
        position=Position(
            offset=Point(
                x=_default.submerge.position.offset.x,
                y=_default.submerge.position.offset.y,
                z=_default.submerge.position.offset.z,
            ),
            ref=_default.submerge.position.ref,
        ),
        speed=_default.submerge.speed,
        delay=_default.submerge.delay,
        lld=_default.submerge.lld,
    ),
    retract=Retract(
        position=Position(
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
        blow_out=BlowOut(
            enabled=_default.retract.blow_out.enabled,
            position=Position(
                offset=Point(
                    x=_default.retract.blow_out.position.offset.x,
                    y=_default.retract.blow_out.position.offset.y,
                    z=_default.retract.blow_out.position.offset.z,
                ),
                ref=_default.retract.blow_out.position.ref,
            ),
            volume=_default.retract.blow_out.volume,
        ),
        touch_tip=TouchTip(
            enabled=_default.retract.touch_tip.enabled,
            position=Position(
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
    aspirate=Aspirate(
        order=_default.aspirate.order,
        position=Position(
            offset=Point(
                x=_default.aspirate.position.offset.x,
                y=_default.aspirate.position.offset.y,
                z=_default.aspirate.position.offset.z,
            ),
            ref=_default.aspirate.position.ref,
        ),
        flow_rate=_default.aspirate.flow_rate,
        delay=_default.aspirate.delay,
        mix=Mix(
            enabled=_default.aspirate.mix.enabled,
            count=_default.aspirate.mix.count,
            volume=_default.aspirate.mix.volume,
        ),
        distribute=Distribute(
            enabled=_default.aspirate.distribute.enabled,
            conditioning_volume=_default.aspirate.distribute.conditioning_volume,
            disposal_volume=_default.aspirate.distribute.disposal_volume,
        ),
    ),
    dispense=Dispense(
        order=_default.dispense.order,
        position=Position(
            offset=Point(
                x=_default.dispense.position.offset.x,
                y=_default.dispense.position.offset.y,
                z=_default.dispense.position.offset.z,
            ),
            ref=_default.dispense.position.ref,
        ),
        flow_rate=_default.dispense.flow_rate,
        delay=_default.dispense.delay,
        mix=Mix(
            enabled=_default.dispense.mix.enabled,
            count=_default.dispense.mix.count,
            volume=_default.dispense.mix.volume,
        ),
        push_out=_default.dispense.push_out,
    ),
)

__all__ = [
    "default",
    "p1000",
    "p50",
]
