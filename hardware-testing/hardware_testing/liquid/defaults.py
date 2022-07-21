from hardware_testing.liquid.liquid_class import (
    LiquidClassSettings,
    SampleConfig,
    AirConfig,
    MovementConfig,
    ACTUAL_OT2_BLOW_OUT_VOLUME_P300,
)

DEFAULT_LIQUID_CLASS_OT2_P300_SINGLE = LiquidClassSettings(
    aspirate=SampleConfig(flow_rate=47, delay=1, acceleration=None),
    dispense=SampleConfig(flow_rate=47, delay=0, acceleration=None),
    blow_out=AirConfig(flow_rate=200, volume=ACTUAL_OT2_BLOW_OUT_VOLUME_P300),
    wet_air_gap=AirConfig(flow_rate=10, volume=4),
    dry_air_gap=AirConfig(flow_rate=47, volume=0),
    submerge=MovementConfig(distance=1.5, speed=5, delay=None, acceleration=None),
    tracking=MovementConfig(distance=0, speed=None, delay=None, acceleration=None),
    retract=MovementConfig(distance=3, speed=5, delay=None, acceleration=None),
    traverse=MovementConfig(distance=None, speed=50, delay=None, acceleration=None),
)
