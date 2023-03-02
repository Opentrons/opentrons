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


def interpolate(
    a: LiquidClassSettings, b: LiquidClassSettings, factor: float
) -> LiquidClassSettings:
    """Interpolate."""

    def _interp(lower: float, upper: float) -> float:
        return lower + ((upper - lower) * factor)

    return LiquidClassSettings(
        aspirate=AspirateSettings(
            flow_rate=_interp(a.aspirate.flow_rate, b.aspirate.flow_rate),
            delay=_interp(a.aspirate.delay, b.aspirate.delay),
            submerge=_interp(a.aspirate.submerge, b.aspirate.submerge),
            retract=_interp(a.aspirate.retract, b.aspirate.retract),
            air_gap=AirGapSettings(
                leading_air_gap=_interp(
                    a.aspirate.air_gap.leading_air_gap,
                    b.aspirate.air_gap.leading_air_gap,
                ),
                trailing_air_gap=_interp(
                    a.aspirate.air_gap.trailing_air_gap,
                    b.aspirate.air_gap.trailing_air_gap,
                ),
            ),
        ),
        dispense=DispenseSettings(
            flow_rate=_interp(a.dispense.flow_rate, b.dispense.flow_rate),
            delay=_interp(a.dispense.delay, b.dispense.delay),
            submerge=_interp(a.dispense.submerge, b.dispense.submerge),
            retract=_interp(a.dispense.retract, b.dispense.retract),
            acceleration=_interp(a.dispense.acceleration, b.dispense.acceleration),
            deceleration=_interp(a.dispense.deceleration, b.dispense.deceleration),
        ),
    )
