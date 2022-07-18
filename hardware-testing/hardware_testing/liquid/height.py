from abc import ABC, abstractmethod
from dataclasses import dataclass
import math
from typing import List, Optional, Tuple

from opentrons.protocol_api.labware import Well
from opentrons.protocol_api import InstrumentContext, ProtocolContext

from hardware_testing.opentrons_api.helpers import (
    well_is_reservoir,
    get_list_of_wells_affected,
)


class CalcType(ABC):
    @abstractmethod
    def max_volume(self) -> float:
        ...

    @abstractmethod
    def height_from_volume(self, volume: float) -> float:
        ...

    @abstractmethod
    def volume_from_height(self, height: float) -> float:
        ...


@dataclass
class CalcTypeCube(CalcType):
    width: float
    length: float
    depth: float

    def max_volume(self) -> float:
        return self.width * self.length * self.depth

    def height_from_volume(self, volume: float) -> float:
        assert 0 <= volume <= self.max_volume(), f"Volume {volume} is out of range"
        return (volume / self.max_volume()) * self.depth

    def volume_from_height(self, height: float) -> float:
        assert 0 <= height <= self.depth, f"Height {height} is out of range"
        return (height / self.depth) * self.max_volume()


@dataclass
class CalcTypeCylinder(CalcType):
    diameter: float
    depth: float

    def max_volume(self) -> float:
        return math.pi * pow(self.diameter / 2, 2) * self.depth

    def height_from_volume(self, volume: float) -> float:
        assert 0 <= volume <= self.max_volume(), f"Volume {volume} is out of range"
        return (volume / self.max_volume()) * self.depth

    def volume_from_height(self, height: float) -> float:
        assert 0 <= height <= self.depth, f"Height {height} is out of range"
        return (height / self.depth) * self.max_volume()


@dataclass
class CalcTypeLookup(CalcType):
    lookup: List[tuple]  # [(ul, mm), (ul, mm)]

    @property
    def depth(self) -> float:
        return self.lookup[-1][1]

    def max_volume(self) -> float:
        return self.lookup[-1][0]

    def height_from_volume(self, volume: float) -> float:
        assert 0 <= volume <= self.max_volume(), f"Volume {volume} is out of range"
        for i, (lv, lh) in enumerate(self.lookup[1:]):
            plv, plh = self.lookup[i - 1]
            if plv <= volume <= lv:
                v_perc = (volume - plv) / (lv - plv)
                return plh + ((lh - plh) * v_perc)
        raise ValueError(f"Unable to find volume ({volume}) in lookup table")

    def volume_from_height(self, height: float) -> float:
        assert 0 <= height <= self.depth, f"Height {height} is out of range"
        for i, (lv, lh) in enumerate(self.lookup[1:]):
            plv, plh = self.lookup[i - 1]
            if plh < height < lh:
                h_perc = (height - plh) / (lh - plv)
                return plv + ((lv - plv) * h_perc)
        raise ValueError(f"Unable to find height ({height}) in lookup table")


class LiquidContent:
    def __init__(self, calc_type: CalcType) -> None:
        self._calc_type = calc_type
        self._volume: float = 0
        self._name: str = "Unknown"

    def set_volume(self, volume: float) -> None:
        self._volume = volume

    def get_volume(self) -> float:
        return float(self._volume)

    def set_name(self, name: str) -> None:
        self._name = str(name)

    @property
    def name(self) -> str:
        return self._name

    def update_volume(
        self,
        after_aspirate: Optional[float] = None,
        after_dispense: Optional[float] = None,
    ) -> None:
        if after_aspirate is not None:
            self.set_volume(self.get_volume() - after_aspirate)
        elif after_dispense is not None:
            self.set_volume(self.get_volume() + after_dispense)

    def set_volume_from_height(self, liquid_height: float) -> None:
        max_vol = self._calc_type.max_volume()
        vol = self._calc_type.volume_from_height(liquid_height)
        assert vol >= 0, f"{vol} uL is less than 0 uL"
        assert vol <= max_vol, f"{vol} uL is greater than {max_vol} uL"
        self.set_volume(vol)

    def get_height(
        self,
        after_aspirate: Optional[float] = None,
        after_dispense: Optional[float] = None,
    ) -> float:
        vol = self.get_volume()
        if after_aspirate is not None:
            vol -= after_aspirate
        if after_dispense is not None:
            vol += after_dispense
        return self._calc_type.height_from_volume(vol)


def _get_actual_volume_change_in_well(
    pipette: InstrumentContext, well: Well, volume: Optional[float]
) -> Optional[float]:
    """Get the actual volume change in well, depending on if the pipette is single or multi."""
    if volume is None:
        return None
    if well_is_reservoir(well):
        volume *= pipette.channels
    return volume


class LiquidTracker:
    def __init__(self) -> None:
        self._items: dict = dict({})

    def initialize_from_deck(self, protocol: ProtocolContext) -> None:
        # NOTE: For Corning 3631, assuming a perfect cylinder creates
        #       an error of -0.78mm when Corning 3631 plate is full (~360uL)
        #       This means the software will think the liquid is
        #       0.78mm lower than it is in reality. To make it more
        #       accurate, give .init_liquid_height() a lookup table
        self.reset()
        for lw in protocol.loaded_labwares.values():
            for w in lw.wells():
                self.init_well_liquid_height(w)

    def reset(self) -> None:
        for key in self._items:
            del self._items[key]

    def print_setup_instructions(self, user_confirm: bool = False) -> None:
        found = [
            (well, tracker)
            for well, tracker in self._items.items()
            if tracker.get_volume() > 0
        ]
        if not len(found):
            return
        print("Add the following volumes (uL) to the specified wells:")
        for well, tracker in found:
            print(
                f"\t{tracker.name}   -> {int(tracker.get_volume())} uL -> {well.display_name}"
            )
        if user_confirm:
            input("\npress ENTER when ready...")

    def init_well_liquid_height(
        self, well: Well, lookup_table: Optional[list] = None
    ) -> None:
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
        self._items[well].set_volume(volume)

    def add_start_volume(
        self, well: Well, volume: float, name: Optional[str] = None
    ) -> None:
        self.update_well_volume(well, after_dispense=volume)
        self._items[well].set_name(name)

    def set_start_volume_from_liquid_height(
        self, well: Well, liquid_height: float, name: Optional[str] = None
    ) -> None:
        self._items[well].set_volume_from_height(liquid_height)
        self._items[well].set_name(name)

    def get_liquid_height(
        self,
        well: Well,
        after_aspirate: Optional[float] = None,
        after_dispense: Optional[float] = None,
    ) -> float:
        return self._items[well].get_height(
            after_aspirate=after_aspirate, after_dispense=after_dispense
        )

    def get_volume(self, well: Well) -> float:
        return self._items[well].get_volume()

    def get_height_change(
        self,
        well: Well,
        after_aspirate: Optional[float] = None,
        after_dispense: Optional[float] = None,
    ) -> float:
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
        self._items[well].update_volume(
            after_aspirate=after_aspirate, after_dispense=after_dispense
        )

    def get_before_and_after_heights(
        self, pipette: InstrumentContext, well: Well, aspirate=None, dispense=None
    ) -> Tuple[float, float]:
        actual_aspirate_amount = _get_actual_volume_change_in_well(
            pipette, well, volume=aspirate
        )
        actual_dispense_amount = _get_actual_volume_change_in_well(
            pipette, well, volume=dispense
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
        pipette: InstrumentContext,
        well: Well,
        aspirate: Optional[float] = None,
        dispense: Optional[float] = None,
    ) -> None:
        actual_aspirate_amount = _get_actual_volume_change_in_well(
            pipette, well, volume=aspirate
        )
        actual_dispense_amount = _get_actual_volume_change_in_well(
            pipette, well, volume=dispense
        )
        for w in get_list_of_wells_affected(pipette, well):
            self.update_well_volume(
                w,
                after_aspirate=actual_aspirate_amount,
                after_dispense=actual_dispense_amount,
            )
        return
