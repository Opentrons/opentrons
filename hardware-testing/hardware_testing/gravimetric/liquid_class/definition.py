"""Liquid Class."""
from dataclasses import dataclass
from typing import Optional


@dataclass
class LiquidSettings:
    """Liquid Settings for both aspirate and dispense."""

    z_submerge_depth: Optional[float]  # millimeters below meniscus
    plunger_flow_rate: Optional[float]  # ul/sec
    delay: Optional[float]  # seconds
    z_retract_height: Optional[float]  # millimeters above meniscus


@dataclass
class AspirateSettings(LiquidSettings):
    """Aspirate Settings."""

    trailing_air_gap: Optional[float]  # microliters


@dataclass
class DispenseSettings(LiquidSettings):
    """Dispense Settings."""

    blow_out_submerged: Optional[float]  # microliters


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
            z_submerge_depth=_interp(
                a.aspirate.z_submerge_depth, b.aspirate.z_submerge_depth
            ),
            plunger_flow_rate=_interp(
                a.aspirate.plunger_flow_rate, b.aspirate.plunger_flow_rate
            ),
            delay=_interp(a.aspirate.delay, b.aspirate.delay),
            z_retract_height=_interp(
                a.aspirate.z_retract_height, b.aspirate.z_retract_height
            ),
            trailing_air_gap=_interp(
                a.aspirate.trailing_air_gap, b.aspirate.trailing_air_gap
            ),
        ),
        dispense=DispenseSettings(
            z_submerge_depth=_interp(
                a.dispense.z_submerge_depth, b.dispense.z_submerge_depth
            ),
            plunger_flow_rate=_interp(
                a.dispense.plunger_flow_rate, b.dispense.plunger_flow_rate
            ),
            delay=_interp(a.dispense.delay, b.dispense.delay),
            z_retract_height=_interp(
                a.dispense.z_retract_height, b.dispense.z_retract_height
            ),
            blow_out_submerged=_interp(
                a.dispense.blow_out_submerged, b.dispense.blow_out_submerged
            ),
        ),
    )
