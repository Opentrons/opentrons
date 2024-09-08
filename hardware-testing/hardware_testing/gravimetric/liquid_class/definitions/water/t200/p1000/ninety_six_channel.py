from . import default
from hardware_testing.gravimetric.liquid_class.liquid_class_settings import (
    LiquidClassSettings,
    AspirateSettings,
    DispenseSettings,
)

_ch_default = LiquidClassSettings(
    aspirate=AspirateSettings(
        z_submerge_depth=default.aspirate.z_sumberge_depth,
        plunger_flow_rate=default.aspirate.plunger_flow_rate,
        delay=default.aspirate.delay,
        z_retract_height=default.aspirate.z_retract_height,
        air_gap=default.aspirate.air_gap,
    ),
    dispense=DispenseSettings(
        z_submerge_depth=default.dispense.z_submerge_depth,
        plunger_flow_rate=default.dispense.plunger_flow_rate,
        delay=default.dispense.delay,
        z_retract_height=default.dispense.z_retract_height,
        push_out=default.dispense.push_out,
    ),
)

VOLUMES = {
    1: LiquidClassSettings(
        aspirate=AspirateSettings(
            z_submerge_depth=_ch_default.aspirate.z_submerge_depth,
            plunger_flow_rate=_ch_default.aspirate.plunger_flow_rate,
            delay=_ch_default.aspirate.delay,
            z_retract_height=_ch_default.aspirate.z_retract_height,
            air_gap=_ch_default.aspirate.air_gap,
        ),
        dispense=DispenseSettings(
            z_submerge_depth=_ch_default.dispense.z_submerge_depth,
            plunger_flow_rate=_ch_default.dispense.plunger_flow_rate,
            delay=_ch_default.dispense.delay,
            z_retract_height=_ch_default.dispense.z_retract_height,
            push_out=_ch_default.dispense.push_out,
        ),
    ),
}
