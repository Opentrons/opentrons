"""Liquid Class."""
from dataclasses import dataclass
from typing import Optional


@dataclass
class LiquidSettings:
    """Liquid Settings for both aspirate and dispense."""

    z_speed: Optional[float]  # mm/sec of mount during submerge/retract
    submerge_mm: Optional[float]  # millimeters below meniscus
    flow_rate: Optional[float]  # ul/sec
    delay: Optional[float]  # seconds
    retract_mm: Optional[float]  # millimeters above meniscus


@dataclass
class AspirateSettings(LiquidSettings):
    """Aspirate Settings."""

    air_gap: Optional[float]  # microliters


@dataclass
class DispenseSettings(LiquidSettings):
    """Dispense Settings."""

    push_out: Optional[float]  # microliters


@dataclass
class LiquidClassSettings:
    """Liquid Class Settings."""

    aspirate: AspirateSettings
    dispense: DispenseSettings
    volume_correction_version: Optional[str]


def interpolate(
    a: LiquidClassSettings, b: LiquidClassSettings, factor: float
) -> LiquidClassSettings:
    """Interpolate."""

    def _interp(lower: float, upper: float) -> float:
        return lower + ((upper - lower) * factor)

    return LiquidClassSettings(
        aspirate=AspirateSettings(
            submerge_mm=_interp(a.aspirate.submerge_mm, b.aspirate.submerge_mm),
            flow_rate=_interp(a.aspirate.flow_rate, b.aspirate.flow_rate),
            delay=_interp(a.aspirate.delay, b.aspirate.delay),
            retract_mm=_interp(a.aspirate.retract_mm, b.aspirate.retract_mm),
            air_gap=_interp(a.aspirate.air_gap, b.aspirate.air_gap),
        ),
        dispense=DispenseSettings(
            submerge_mm=_interp(a.dispense.submerge_mm, b.dispense.submerge_mm),
            flow_rate=_interp(a.dispense.flow_rate, b.dispense.flow_rate),
            delay=_interp(a.dispense.delay, b.dispense.delay),
            retract_mm=_interp(a.dispense.retract_mm, b.dispense.retract_mm),
            push_out=_interp(a.dispense.push_out, b.dispense.push_out),
        ),
    )
