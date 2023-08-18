"""Liquid Height."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
import math
from typing import List, Optional, Tuple

from opentrons.protocol_api.labware import Well
from opentrons.protocol_api import ProtocolContext

from hardware_testing.gravimetric import helpers


class CalcType(ABC):
    """Calculation Type."""

    @abstractmethod
    def max_volume(self) -> float:
        """Calculate the well maximum volume."""
        ...

    @abstractmethod
    def height_from_volume(self, volume: float) -> float:
        """Calculate the liquid height given a volume."""
        ...

    @abstractmethod
    def volume_from_height(self, height: float) -> float:
        """Calculate the liquid volume given a height."""
        ...


@dataclass
class CalcTypeCube(CalcType):
    """Calculate Type Cube."""

    width: float
    length: float
    depth: float

    def max_volume(self) -> float:
        """Calculate the well maximum volume."""
        return self.width * self.length * self.depth

    def height_from_volume(self, volume: float) -> float:
        """Calculate the liquid height given a volume."""
        assert 0 <= volume <= self.max_volume(), f"Volume {volume} is out of range"
        return (volume / self.max_volume()) * self.depth

    def volume_from_height(self, height: float) -> float:
        """Calculate the liquid volume given a height."""
        assert 0 <= height <= self.depth, f"Height {height} is out of range"
        return (height / self.depth) * self.max_volume()


@dataclass
class CalcTypeCylinder(CalcType):
    """Calculate Type Cylinder."""

    diameter: float
    depth: float

    def max_volume(self) -> float:
        """Calculate the well maximum volume."""
        return math.pi * pow(self.diameter / 2, 2) * self.depth

    def height_from_volume(self, volume: float) -> float:
        """Calculate the liquid height given a volume."""
        assert (
            0 <= volume <= self.max_volume()
        ), f"Volume {volume} is out of range {self.max_volume()}"
        return (volume / self.max_volume()) * self.depth

    def volume_from_height(self, height: float) -> float:
        """Calculate the liquid volume given a height."""
        assert (
            0 <= height <= self.depth
        ), f"Height {height} is out of range {self.depth}"
        return (height / self.depth) * self.max_volume()


@dataclass
class CalcTypeLookup(CalcType):
    """Calculate Type Lookup."""

    lookup: List[tuple]  # [(ul, mm), (ul, mm)]

    @property
    def depth(self) -> float:
        """Well Depth."""
        return self.lookup[-1][1]

    def max_volume(self) -> float:
        """Well Max Volume."""
        return self.lookup[-1][0]

    def height_from_volume(self, volume: float) -> float:
        """Calculate the liquid height given a volume."""
        assert 0 <= volume <= self.max_volume(), f"Volume {volume} is out of range"
        if volume == 0:
            return 0
        for i, (lv, lh) in enumerate(self.lookup):
            if i == 0:
                continue
            plv, plh = self.lookup[i - 1]
            if plv <= volume <= lv:
                v_perc = (volume - plv) / (lv - plv)
                return plh + ((lh - plh) * v_perc)
        raise ValueError(f"Unable to find volume ({volume}) in lookup table")

    def volume_from_height(self, height: float) -> float:
        """Calculate the liquid volume given a height."""
        assert 0 <= height <= self.depth, f"Height {height} is out of range"
        if height == 0:
            return 0
        for i, (v, h) in enumerate(self.lookup):
            if i == 0:
                continue
            pv, ph = self.lookup[i - 1]
            if ph <= height <= h:
                h_perc = (height - ph) / (h - pv)
                return pv + ((v - pv) * h_perc)
        raise ValueError(f"Unable to find height ({height}) in lookup table")


class LiquidContent:
    """Liquid Content."""

    def __init__(self, calc_type: CalcType) -> None:
        """Liquid Content."""
        self._calc_type = calc_type
        self._volume: float = 0
        self._name: str = "Unknown"

    def set_volume(self, volume: float) -> None:
        """Set volume."""
        if not 0 <= volume <= self._calc_type.max_volume():
            raise ValueError(f"Volume out of range: {volume}")
        self._volume = volume

    def get_volume(self) -> float:
        """Get volume."""
        return float(self._volume)

    def set_name(self, name: str) -> None:
        """Set name."""
        self._name = str(name)

    @property
    def name(self) -> str:
        """Name."""
        return self._name

    def update_volume(
        self,
        after_aspirate: Optional[float] = None,
        after_dispense: Optional[float] = None,
    ) -> None:
        """Update volume."""
        if after_aspirate and after_dispense:
            raise ValueError(
                'Both "after_aspirate=" and "after_dispense=" cannot be set'
            )
        if after_aspirate is not None:
            new_vol = self.get_volume() - after_aspirate
        elif after_dispense is not None:
            new_vol = self.get_volume() + after_dispense
        else:
            raise ValueError(
                'Either "after_aspirate=" or "after_dispense=" must be positive integers'
            )
        self.set_volume(new_vol)

    def set_volume_from_height(self, liquid_height: float) -> None:
        """Set volume from height."""
        vol = self._calc_type.volume_from_height(liquid_height)
        self.set_volume(vol)

    def get_height(
        self,
        after_aspirate: Optional[float] = None,
        after_dispense: Optional[float] = None,
    ) -> float:
        """Get volume."""
        vol = self.get_volume()
        if after_aspirate is not None:
            vol -= after_aspirate
        if after_dispense is not None:
            vol += after_dispense
        return self._calc_type.height_from_volume(vol)


def _get_actual_volume_change_in_well(
    well: Well,
    volume: Optional[float],
    channels: int = 1,
) -> Optional[float]:
    """Get the actual volume change in well, depending on if the pipette is single or multi."""
    if volume is None:
        return None
    if helpers.well_is_reservoir(well):
        volume *= float(channels)
    return volume


class LiquidTracker:
    """Liquid Tracker."""

    def __init__(self, ctx: Optional[ProtocolContext] = None) -> None:
        """Liquid Tracker."""
        self._items: dict = dict({})
        if ctx is not None:
            initialize_liquid_from_deck(ctx, self)

    def reset(self) -> None:
        """Reset."""
        for key in list(self._items.keys()):
            del self._items[key]

    def get_setup_instructions_string(self) -> str:
        """Print setup instructions."""
        found = [
            (well, tracker)
            for well, tracker in self._items.items()
            if tracker.get_volume() > 0
        ]
        if not len(found):
            return ""
        ret_str = ["Add the following volumes (uL) to the specified wells:"]
        for well, tracker in found:
            ret_str.append(
                f"\t{tracker.name}   -> {int(tracker.get_volume())} uL -> {well.display_name}"
            )
        return "\n".join(ret_str)

    def init_well_liquid_height(
        self, well: Well, lookup_table: Optional[list] = None
    ) -> None:
        """Init well liquid height."""
        calc_type: CalcType
        if lookup_table:
            calc_type = CalcTypeLookup(lookup=lookup_table)
        elif well.diameter:
            calc_type = CalcTypeCylinder(diameter=well.diameter, depth=well.depth)
        else:
            assert well.width
            assert well.length
            calc_type = CalcTypeCube(
                width=well.width, length=well.length, depth=well.depth
            )
        if well in self._items:
            del self._items[well]
        self._items[well] = LiquidContent(calc_type)

    def set_start_volume(self, well: Well, volume: float) -> None:
        """Set start volume."""
        self._items[well].set_volume(volume)

    def set_start_volume_from_liquid_height(
        self, well: Well, liquid_height: float, name: Optional[str] = None
    ) -> None:
        """Set start volume from liquid height."""
        self._items[well].set_volume_from_height(liquid_height)
        self._items[well].set_name(name)

    def get_liquid_height(
        self,
        well: Well,
        after_aspirate: Optional[float] = None,
        after_dispense: Optional[float] = None,
    ) -> float:
        """Get liquid height."""
        return self._items[well].get_height(
            after_aspirate=after_aspirate, after_dispense=after_dispense
        )

    def get_volume(self, well: Well) -> float:
        """Get volume."""
        return self._items[well].get_volume()

    def get_height_change(
        self,
        well: Well,
        after_aspirate: Optional[float] = None,
        after_dispense: Optional[float] = None,
    ) -> float:
        """Get height change."""
        start = self.get_liquid_height(well)
        end = self.get_liquid_height(
            well, after_aspirate=after_aspirate, after_dispense=after_dispense
        )
        return end - start

    def update_well_volume(
        self,
        well: Well,
        after_aspirate: Optional[float] = None,
        after_dispense: Optional[float] = None,
    ) -> None:
        """Update well volume."""
        self._items[well].update_volume(
            after_aspirate=after_aspirate, after_dispense=after_dispense
        )

    def get_before_and_after_heights(
        self,
        well: Well,
        aspirate: Optional[float] = None,
        dispense: Optional[float] = None,
        channels: int = 1,
    ) -> Tuple[float, float]:
        """Get before and after heights."""
        actual_aspirate_amount = _get_actual_volume_change_in_well(
            well,
            volume=aspirate,
            channels=channels,
        )
        actual_dispense_amount = _get_actual_volume_change_in_well(
            well,
            volume=dispense,
            channels=channels,
        )
        before = self.get_liquid_height(well)
        after = self.get_liquid_height(
            well,
            after_aspirate=actual_aspirate_amount,
            after_dispense=actual_dispense_amount,
        )
        return before, after

    def update_affected_wells(
        self,
        well: Well,
        aspirate: Optional[float] = None,
        dispense: Optional[float] = None,
        channels: int = 1,
    ) -> None:
        """Update affected wells."""
        actual_aspirate_amount = _get_actual_volume_change_in_well(
            well,
            volume=aspirate,
            channels=channels,
        )
        actual_dispense_amount = _get_actual_volume_change_in_well(
            well,
            volume=dispense,
            channels=channels,
        )
        for w in helpers.get_list_of_wells_affected(well, channels):
            self.update_well_volume(
                w,
                after_aspirate=actual_aspirate_amount,
                after_dispense=actual_dispense_amount,
            )
        return


def initialize_liquid_from_deck(ctx: ProtocolContext, lt: LiquidTracker) -> None:
    """Initialize liquid from deck."""
    # NOTE: For Corning 3631, assuming a perfect cylinder creates
    #       an error of -0.78mm when Corning 3631 plate is full (~360uL)
    #       This means the software will think the liquid is
    #       0.78mm lower than it is in reality. To make it more
    #       accurate, give .init_liquid_height() a lookup table
    lt.reset()
    for lw in ctx.loaded_labwares.values():
        if lw.is_tiprack or "trash" in lw.name.lower():
            continue
        for w in lw.wells():
            lt.init_well_liquid_height(w)
