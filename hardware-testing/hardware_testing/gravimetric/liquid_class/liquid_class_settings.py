"""Liquid Class Settings."""
from copy import deepcopy
from dataclasses import dataclass, fields
from typing import List, Optional

from opentrons.types import Point


@dataclass
class _Interpolate:
    @classmethod
    def interpolate(
        cls,
        target_vol: float,
        a_vol: float,
        b_vol: float,
        a: "_Interpolate",
        b: "_Interpolate",
    ) -> "_Interpolate":
        # scale assumes 1.0 means all of "A", and 0.0 means all of "B"
        scale = abs((target_vol - b_vol) / (a_vol - b_vol))
        assert 0.0 <= scale <= 1.0, f"{scale} ({target_vol}, {a_vol}, {b_vol})"
        # create a copy, which will be returned
        assert a.__class__ == b.__class__, f"{a.__class__} != {b.__class__}"
        ret = deepcopy(a)
        for field in fields(cls):
            val_a = getattr(a, field.name)
            val_b = getattr(b, field.name)
            t = field.type
            if t == Point or t == float or t == int:
                # interpolate values
                new_val = (scale * val_a) + ((1.0 - scale) * val_b)
                if t == int:
                    assert isinstance(new_val, float)
                    new_val = int(new_val)
            elif t == bool or t == str or t == list:
                # no interpolation, but confirm values are identical
                assert (
                    val_a == val_b
                ), f"{val_a} != {val_b} (must match when interpolating)"
                new_val = deepcopy(val_a)
            elif isinstance(val_a, _Interpolate) and isinstance(val_b, _Interpolate):
                # recursively interpolate sub-settings
                new_val = cls.interpolate(target_vol, a_vol, b_vol, val_a, val_b)
            else:
                raise ValueError(f"Unexpected field: {field.name} ({field.type})")
            setattr(ret, field.name, new_val)
        return ret


@dataclass
class PositionSettings(_Interpolate):
    offset: Point
    ref: str


@dataclass
class _ZMoves(_Interpolate):
    position: PositionSettings
    speed: float
    delay: float


@dataclass
class SubmergeSettings(_ZMoves):
    """Submerge Settings."""

    lld_enabled: bool


@dataclass
class BlowOutSettings(_Interpolate):
    """Blow-Out Settings."""

    enabled: bool
    position: PositionSettings


@dataclass
class TouchTipSettings(_Interpolate):
    """Touch-Tip Settings."""

    enabled: bool
    position: PositionSettings
    speed: float
    mm_to_edge: float


@dataclass
class RetractSettings(_ZMoves):
    """Retract Settings."""

    air_gap: float
    blow_out: BlowOutSettings
    touch_tip: TouchTipSettings


@dataclass
class MixSettings(_Interpolate):
    enabled: bool
    count: int
    volume: Optional[float]


@dataclass
class _PlungerMoves(_Interpolate):
    order: List[str]
    position: PositionSettings
    flow_rate: float
    delay: float
    mix: MixSettings


@dataclass
class AspirateSettings(_PlungerMoves):
    """Aspirate Settings."""

    conditioning_volume: float
    disposal_volume: float


@dataclass
class DispenseSettings(_PlungerMoves):
    """Dispense Settings."""

    push_out: float


@dataclass
class LiquidClassSettings(_Interpolate):
    """Liquid Class Settings."""

    submerge: SubmergeSettings
    retract: RetractSettings
    aspirate: AspirateSettings
    dispense: DispenseSettings
