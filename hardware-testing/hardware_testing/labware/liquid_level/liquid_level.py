from abc import ABC, abstractmethod
from collections import namedtuple
from dataclasses import dataclass
import math
from typing import List


@dataclass
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
        assert 0 <= volume <= self.max_volume(), f'Volume {volume} is out of range'
        return (volume / self.max_volume()) * self.depth

    def volume_from_height(self, height: float) -> float:
        assert 0 <= height <= self.depth, f'Height {height} is out of range'
        return (height / self.depth) * self.max_volume()


@dataclass
class CalcTypeCylinder(CalcType):
    diameter: float
    depth: float

    def max_volume(self) -> float:
        return math.pi * pow(self.diameter / 2, 2) * self.depth

    def height_from_volume(self, volume: float) -> float:
        assert 0 <= volume <= self.max_volume(), f'Volume {volume} is out of range'
        return (volume / self.max_volume()) * self.depth

    def volume_from_height(self, height: float) -> float:
        assert 0 <= height <= self.depth, f'Height {height} is out of range'
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
        assert 0 <= volume <= self.max_volume(), f'Volume {volume} is out of range'
        for i, (lv, lh) in enumerate(self.lookup[1:]):
            plv, plh = self.lookup[i - 1]
            if plv <= volume <= lv:
                v_perc = (volume - plv) / (lv - plv)
                return plh + ((lh - plh) * v_perc)
        raise ValueError(
            f'Unable to find volume ({volume}) in lookup table')

    def volume_from_height(self, height: float) -> float:
        assert 0 <= height <= self.depth, f'Height {height} is out of range'
        for i, (lv, lh) in enumerate(self.lookup[1:]):
            plv, plh = self.lookup[i - 1]
            if plh < height < lh:
                h_perc = (height - plh) / (lh - plv)
                return plv + ((lv - plv) * h_perc)
        raise ValueError(
            f'Unable to find height ({height}) in lookup table')


class LiquidHeight:

    def __init__(self, calc_type):
        self._calc_type = calc_type
        self._volume = 0
        self._name = None

    def set_volume(self, volume):
        self._volume = volume

    def get_volume(self):
        return float(self._volume)

    def set_name(self, name):
        self._name = str(name)

    @property
    def name(self):
        return self._name

    def update_volume(self, after_aspirate=None, after_dispense=None):
        if after_aspirate is not None:
            self.set_volume(self.get_volume() - after_aspirate)
        elif after_dispense is not None:
            self.set_volume(self.get_volume() + after_dispense)

    def set_volume_from_height(self, liquid_height):
        max_vol = self._calc_type.max_volume
        vol = self._calc_type.volume_from_height(liquid_height)
        assert vol >= 0, f'{vol} uL is less than 0 uL'
        assert vol <= max_vol, f'{vol} uL is greater than {max_vol} uL'
        self.set_volume(vol)

    def get_height(self, after_aspirate=None, after_dispense=None):
        vol = self.get_volume()
        if after_aspirate is not None:
            vol -= after_aspirate
        if after_dispense is not None:
            vol += after_dispense
        return self._calc_type.height_from_volume(vol)


class LiquidTracker:

    def __init__(self) -> None:
        self._items = {}
        return

    def reset(self):
        for key in self._items:
            del self._items[key]

    def print_setup_instructions(self, user_confirm=False):
        found = [(well, tracker)
                 for well, tracker in self._items.items()
                 if tracker.get_volume() > 0]
        if not len(found):
            return
        print('Add the following volumes (uL) to the specified wells:')
        for well, tracker in found:
            print(f'\t{tracker.name}   -> {int(tracker.get_volume())} uL -> {well.display_name}')
        if user_confirm:
            input('\npress ENTER when ready...')

    def init_liquid_height(self, well, lookup_table=None):
        if lookup_table:
            calc_type = CalcTypeLookup(lookup=lookup_table)
        elif well.diameter:
            calc_type = CalcTypeCylinder(diameter=well.diameter, depth=well.depth)
        else:
            calc_type = CalcTypeCube(width=well.width, length=well.length, depth=well.depth)
        if well in self._items:
            del self._items[well]
        self._items[well] = LiquidHeight(calc_type)

    def set_start_volume(self, well, volume):
        self._items[well].set_volume(volume)

    def add_start_volume(self, well, volume, name=None):
        self.update_well_volume(well, after_dispense=volume)
        self._items[well].set_name(name)

    def set_start_volume_from_liquid_height(self, well, liquid_height, name=None):
        self._items[well].set_volume_from_height(liquid_height)
        self._items[well].set_name(name)

    def get_liquid_height(self, well, after_aspirate=None, after_dispense=None):
        return self._items[well].get_height(
            after_aspirate=after_aspirate, after_dispense=after_dispense)

    def get_volume(self, well):
        return self._items[well].get_volume()

    def get_height_change(self, well, after_aspirate=None, after_dispense=None):
        start = self.get_liquid_height(well)
        end = self.get_liquid_height(
            well, after_aspirate=after_aspirate, after_dispense=after_dispense)
        return end - start

    def update_well_volume(self, well, after_aspirate=None, after_dispense=None):
        self._items[well].update_volume(
            after_aspirate=after_aspirate, after_dispense=after_dispense)


if __name__ == '__main__':
    import os
    import sys
    sys.path.insert(0, os.path.abspath('../pipetting'))
    from lookup_tables import LIQUID_LEVEL_LOOKUP_NEXT_TROUGH_12_ROW as TROUGH_LOOKUP
    FakeWell = namedtuple('FakeWell', 'display_name depth diameter width length')
    fake_well = FakeWell('fake', TROUGH_LOOKUP[-1][1], None, None, None)
    tracker = LiquidTracker()
    tracker.init_liquid_height(fake_well, TROUGH_LOOKUP)
    tracker.set_start_volume(fake_well, 14500)
    while tracker.get_volume(fake_well) > 0:
        ul = tracker.get_volume(fake_well)
        mm = tracker.get_liquid_height(fake_well)
        tracker.update_well_volume(fake_well, after_aspirate=100)
        print(f'{int(ul)} ul  \t({round(mm, 1)} mm)')

