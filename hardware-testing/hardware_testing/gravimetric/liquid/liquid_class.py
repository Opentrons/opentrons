"""Liquid Class."""
from dataclasses import dataclass


@dataclass
class LiquidSettings:
    """Liquid Settings for both aspirate and dispense."""

    flow_rate: float  # ul/sec
    delay: float  # seconds
    submerge: float  # millimeters below meniscus
    retract: float  # millimeters above meniscus


@dataclass
class AirGapSettings:
    """Air Gap Settings."""

    leading_air_gap: float  # microliters
    trailing_air_gap: float  # microliters


@dataclass
class AspirateSettings(LiquidSettings):
    """Aspirate Settings."""

    air_gap: AirGapSettings


@dataclass
class DispenseSettings(LiquidSettings):
    """Dispense Settings."""

    acceleration: float  # ul/sec^2 FIXME: get working within protocol
    deceleration: float  # ul/sec^2 FIXME: get working within protocol


@dataclass
class LiquidClassSettings:
    """Liquid Class Settings."""

    aspirate: AspirateSettings
    dispense: DispenseSettings
    blow_out: bool
    tracking: bool  # FIXME: get working within protocol
