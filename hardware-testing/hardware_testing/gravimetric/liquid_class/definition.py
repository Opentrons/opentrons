"""Liquid Class."""
from dataclasses import dataclass


@dataclass
class LiquidSettings:
    """Liquid Settings for both aspirate and dispense."""

    submerge_depth: float  # millimeters below meniscus
    acceleration: float  # ul/sec^2
    flow_rate: float  # ul/sec
    delay: float  # seconds
    retract_acceleration: float  # mm/sec/sec
    retract_height: float  # millimeters above meniscus


@dataclass
class AspirateSettings(LiquidSettings):
    """Aspirate Settings."""

    trailing_air_gap: float  # microliters


@dataclass
class DispenseSettings(LiquidSettings):
    """Dispense Settings."""

    leading_air_gap: float  # microliters


@dataclass
class LiquidClassSettings:
    """Liquid Class Settings."""

    aspirate: AspirateSettings
    dispense: DispenseSettings


def interpolate(
    a: LiquidClassSettings, b: LiquidClassSettings, factor: float
) -> LiquidClassSettings:
    """Interpolate."""

    def _interp(lower: float, upper: float) -> float:
        return lower + ((upper - lower) * factor)

    return LiquidClassSettings(
        aspirate=AspirateSettings(
            submerge_depth=_interp(a.aspirate.submerge_depth, b.aspirate.submerge_depth),
            acceleration=_interp(a.aspirate.acceleration, b.aspirate.acceleration),
            flow_rate=_interp(a.aspirate.flow_rate, b.aspirate.flow_rate),
            delay=_interp(a.aspirate.delay, b.aspirate.delay),
            retract_acceleration=_interp(a.aspirate.retract_acceleration, b.aspirate.retract_acceleration),
            retract_height=_interp(a.aspirate.retract_height, b.aspirate.retract_height),
            trailing_air_gap=_interp(a.aspirate.trailing_air_gap, b.aspirate.trailing_air_gap),
        ),
        dispense=DispenseSettings(
            submerge_depth=_interp(a.dispense.submerge_depth, b.dispense.submerge_depth),
            acceleration=_interp(a.dispense.acceleration, b.dispense.acceleration),
            flow_rate=_interp(a.dispense.flow_rate, b.dispense.flow_rate),
            delay=_interp(a.dispense.delay, b.dispense.delay),
            retract_acceleration=_interp(a.dispense.retract_acceleration, b.dispense.retract_acceleration),
            retract_height=_interp(a.dispense.retract_height, b.dispense.retract_height),
            leading_air_gap=_interp(a.dispense.leading_air_gap, b.dispense.leading_air_gap),
        ),
    )
