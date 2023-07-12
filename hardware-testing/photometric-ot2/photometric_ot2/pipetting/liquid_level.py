from collections import namedtuple
import math


CalcTypeCube = namedtuple('CalcTypeCube', 'w l h')
CalcTypeCylinder = namedtuple('CalcTypeCylinder', 'd h')
CalcTypeLookup = namedtuple('CalcTypeLookup', 'lookup')  # [(ul, mm), (ul, mm)]

LIQUID_HEIGHT_TRACKER = {}


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
        c_type = type(self._calc_type).__name__.lower()
        vol = None
        if 'cube' in c_type:
            max_vol = self._calc_type.w * self._calc_type.l * self._calc_type.h
            vol = (liquid_height / self._calc_type.h) * max_vol
        elif 'cylinder' in c_type:
            max_vol = math.pi * pow(self._calc_type.d / 2, 2) * self._calc_type.h
            vol = (liquid_height / self._calc_type.h) * max_vol
        elif 'lookup' in c_type:
            max_vol = self._calc_type.lookup[-1][0]
            for i, (lv, lh) in enumerate(self._calc_type.lookup[1:]):
                plv, plh = self._calc_type.lookup[i - 1]
                if plh < liquid_height < lh:
                    h_perc = (liquid_height - plh) / (lh - plv)
                    vol = plv + ((lv - plv) * h_perc)
            if vol is None:
                raise ValueError(
                    f'Unable to find height ({liquid_height}) in lookup table')
        else:
            raise ValueError(f'Unexpected c_type: {self._calc_type}')
        assert vol >= 0, f'{vol} uL is less than 0 uL'
        assert vol <= max_vol, f'{vol} uL is greater than {max_vol} uL'
        self.set_volume(vol)

    def get_height(self, after_aspirate=None, after_dispense=None):
        vol = self.get_volume()
        if after_aspirate is not None:
            vol -= after_aspirate
        if after_dispense is not None:
            vol += after_dispense
        c_type = type(self._calc_type).__name__.lower()
        if 'cube' in c_type:
            cube_max_vol = self._calc_type.w * self._calc_type.l * self._calc_type.h
            assert vol >= 0, f'{vol} uL is less than 0 uL'
            assert vol <= cube_max_vol,\
                f'{vol} uL is greater than {cube_max_vol} uL'
            return (vol / cube_max_vol) * self._calc_type.h
        elif 'cylinder' in c_type:
            cylinder_max_vol = math.pi * pow(self._calc_type.d / 2, 2) * self._calc_type.h
            assert vol >= 0, f'{vol} uL is less than 0 uL'
            assert vol <= cylinder_max_vol,\
                f'{vol} uL is greater than {cylinder_max_vol} uL'
            return (vol / cylinder_max_vol) * self._calc_type.h
        elif 'lookup' in c_type:
            assert vol >= 0, f'{vol} uL is less than 0 uL'
            for i, (lv, lh) in enumerate(self._calc_type.lookup[1:]):
                plv, plh = self._calc_type.lookup[i - 1]
                if plv <= vol <= lv:
                    v_perc = (vol - plv) / (lv - plv)
                    return plh + ((lh - plh) * v_perc)
            raise ValueError(f'Unable to find updated volume ({vol}) in lookup table')
        else:
            raise ValueError(f'Unexpected c_type: {self._calc_type}')


def reset():
    for key in LIQUID_HEIGHT_TRACKER:
        del LIQUID_HEIGHT_TRACKER[key]


def print_setup_instructions(user_confirm=False, refill_vol=0):
    found = [(well, tracker)
             for well, tracker in LIQUID_HEIGHT_TRACKER.items()
             if tracker.get_volume() > 0]
    if not len(found):
        return
    print('\n*******\n')
    print('Add the following volumes (uL) to the specified wells:')
    for well, tracker in found:
        t_name = str(tracker.name)
        if tracker.name.lower() == 'water':
            liq_to_add = '-10mm below top of'
        else:
            liq_to_add = str(int(tracker.get_volume() - refill_vol))
            if refill_vol > 0:
                t_name = '[REFILL] ' + t_name
        print(f'\t{t_name}   -> {liq_to_add} uL -> {well.display_name}')
    if user_confirm:
        input('\npress ENTER when ready...')


def init_liquid_height(well, lookup_table=None):
    if lookup_table:
        calc_type = CalcTypeLookup(lookup_table)
    elif well.diameter:
        calc_type = CalcTypeCylinder(well.diameter, well.depth)
    else:
        calc_type = CalcTypeCube(well.width, well.length, well.depth)
    if well in LIQUID_HEIGHT_TRACKER:
        del LIQUID_HEIGHT_TRACKER[well]
    LIQUID_HEIGHT_TRACKER[well] = LiquidHeight(calc_type)


def set_start_volume(well, volume):
    LIQUID_HEIGHT_TRACKER[well].set_volume(volume)


def add_start_volume(well, volume, name=None):
    update_well_volume(well, after_dispense=volume)
    LIQUID_HEIGHT_TRACKER[well].set_name(name)


def set_start_volume_from_liquid_height(well, liquid_height, name=None):
    LIQUID_HEIGHT_TRACKER[well].set_volume_from_height(liquid_height)
    LIQUID_HEIGHT_TRACKER[well].set_name(name)


def get_liquid_height(well, after_aspirate=None, after_dispense=None):
    return LIQUID_HEIGHT_TRACKER[well].get_height(
        after_aspirate=after_aspirate, after_dispense=after_dispense)


def get_volume(well):
    return LIQUID_HEIGHT_TRACKER[well].get_volume()


def get_height_change(well, after_aspirate=None, after_dispense=None):
    start = get_liquid_height(well)
    end = get_liquid_height(
        well, after_aspirate=after_aspirate, after_dispense=after_dispense)
    return end - start


def update_well_volume(well, after_aspirate=None, after_dispense=None):
    LIQUID_HEIGHT_TRACKER[well].update_volume(
        after_aspirate=after_aspirate, after_dispense=after_dispense)


if __name__ == '__main__':
    import os
    import sys
    sys.path.insert(0, os.path.abspath('.'))
    from lookup_table_12_row_trough_next import LIQUID_LEVEL_LOOKUP_NEXT_TROUGH_12_ROW as TROUGH_LOOKUP
    FakeWell = namedtuple('FakeWell', 'display_name depth diameter width length')
    fake_well = FakeWell('fake', TROUGH_LOOKUP[-1][1], None, None, None)
    init_liquid_height(fake_well, TROUGH_LOOKUP)
    set_start_volume(fake_well, 14500)
    while get_volume(fake_well) > 0:
        ul = get_volume(fake_well)
        mm = get_liquid_height(fake_well)
        update_well_volume(fake_well, after_aspirate=100)
        print(f'{int(ul)} ul  \t({round(mm, 1)} mm)')

