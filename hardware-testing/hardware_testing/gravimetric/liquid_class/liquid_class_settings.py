"""Liquid Class Settings."""
from copy import deepcopy
from enum import Enum
from dataclasses import dataclass, fields
from typing import List

from opentrons.types import Point


CSV_SEPARATOR = "\t"


class PositionRef(str, Enum):
    WELL_BOTTOM = "WELL_BOTTOM"
    WELL_TOP = "WELL_TOP"
    MENISCUS = "MENISCUS"
    TRASH = "TRASH"


@dataclass
class _Interpolate:
    def csv_header(self) -> List[str]:
        """Get the CSV header for these settings."""
        names: List[str] = []
        for f in fields(self):
            print(f.name, f.type, type(f.type))
            if issubclass(f.type, Point):
                names += ["offset-x", "offset-y", "offset-z"]
            elif issubclass(f.type, _Interpolate):
                settings = getattr(self, f.name)
                names += settings.csv_header()
            else:
                names.append(f.name)
        return names

    def csv_data(self) -> List[str]:
        """Get the CSV data for these settings."""
        values: List[str] = []
        for f in fields(self):
            val = getattr(self, f.name)
            if issubclass(f.type, Point):
                values += [str(val.x), str(val.y), str(val.z)]
            elif issubclass(f.type, _Interpolate):
                values += val.csv_header()
            else:
                values.append(str(val))
        return values

    @classmethod
    def interpolate(
        cls,
        target_vol: float,
        a_vol: float,
        b_vol: float,
        a: "_Interpolate",
        b: "_Interpolate",
    ) -> "_Interpolate":
        """Interpolate between liquid class settings."""

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
            elif t == bool or t == str or t == list or isinstance(val_a, PositionRef):
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
class Position(_Interpolate):
    """Position Settings."""

    ref: PositionRef
    offset: Point


@dataclass
class _ZMoves(_Interpolate):
    position: Position
    speed: float
    delay: float


@dataclass
class Submerge(_ZMoves):
    """Submerge Settings."""

    lld: bool


@dataclass
class BlowOut(_Interpolate):
    """Blow-Out Settings."""

    enabled: bool
    position: Position
    volume: float


@dataclass
class TouchTip(_Interpolate):
    """Touch-Tip Settings."""

    enabled: bool
    position: Position
    mm_to_edge: float
    speed: float


@dataclass
class Retract(_ZMoves):
    """Retract Settings."""

    air_gap: float
    blow_out: BlowOut
    touch_tip: TouchTip


@dataclass
class Mix(_Interpolate):
    """Mix Settings."""

    enabled: bool
    count: int
    volume: float


@dataclass
class _PlungerMoves(_Interpolate):
    position: Position
    flow_rate: float
    delay: float
    mix: Mix


@dataclass
class Distribute(_Interpolate):
    """Distribute Settings."""

    enabled: bool
    conditioning_volume: float
    disposal_volume: float


@dataclass
class Aspirate(_PlungerMoves):
    """Aspirate Settings."""

    distribute: Distribute


@dataclass
class Dispense(_PlungerMoves):
    """Dispense Settings."""

    push_out: float


@dataclass
class Liquid(_Interpolate):
    """Liquid Class Settings."""

    submerge: Submerge
    retract: Retract
    aspirate: Aspirate
    dispense: Dispense
