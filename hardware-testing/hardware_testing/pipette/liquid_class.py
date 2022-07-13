from dataclasses import dataclass
from typing import Optional


# NOTE: not sure if this is useful...
#       Nick Starno calculated the actual Pipette.blow_out() volumes:
#           - P1000 = 123.6 uL
#           - P300 = 41.7 uL
#           - P20 = 2.39 uL

# Maximum flow-rates (from "pipetteNameSpec.json")
#   - P1000 = 812 uL
#   - P300 = 275 uL
#   - P20 = 24 uL


@dataclass
class SampleContentConfig:
    flow_rate: float
    delay: float


@dataclass
class AirGapConfig:
    flow_rate: float
    volume: float


@dataclass
class BlowOutConfig:
    flow_rate: float


@dataclass
class MovementConfig:
    distance: float
    speed: float
    delay: float


@dataclass
class LiquidClassSettings:
    aspirate: SampleContent
    dispense: SampleContent
    blow_out: NonSampleContent
    wet_air_gap: NonSampleContent
    dry_air_gap: NonSampleContent
    submerge: Movement
    retract: Movement


LIQUID_CLASS_OT2_P300_SINGLE = LiquidClassSettings(
    aspirate=SampleContent(flow_rate=47, delay=1),
    dispense=SampleContent(flow_rate=47, delay=0),
    blow_out=NonSampleContent(flow_rate=200, delay=0, volume=None),
    wet_air_gap=NonSampleContent(flow_rate=10, delay=0.5, volume=4),
    dry_air_gap=NonSampleContent(flow_rate=47, delay=0, volume=0),
    submerge=Movement(distance=1.5, speed=5, delay=0),
    retract=Movement(distance=3, speed=5, delay=0),
)
