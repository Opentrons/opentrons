import json
import pkgutil

import pytest

from opentrons.protocol_api import labware
from opentrons.types import Point, Location

test_data = {
    'circular_well_json': {
        'shape': 'circular',
        'depth': 40,
        'totalLiquidVolume': 100,
        'diameter': 30,
        'x': 40,
        'y': 50,
        'z': 3
    },
    'rectangular_well_json': {
        'shape': 'rectangular',
        'depth': 20,
        'totalLiquidVolume': 200,
        'length': 50,
        'width': 120,
        'x': 45,
        'y': 10,
        'z': 22
    }
}


def test_well_init():
    slot = Location(Point(1, 2, 3), 1)
    well_name = 'circular_well_json'
    has_tip = False
    well1 = labware.Well(test_data[well_name], slot, well_name, has_tip)
    assert well1._diameter == test_data[well_name]['diameter']
    assert well1._length is None
    assert well1._width is None

    well2_name = 'rectangular_well_json'
    well2 = labware.Well(test_data[well2_name], slot, well2_name, has_tip)
    assert well2._diameter is None
    assert well2._length == test_data[well2_name]['length']
    assert well2._width == test_data[well2_name]['width']


def test_top():
    slot = Location(Point(4, 5, 6), 1)
    well_name = 'circular_well_json'
    has_tip = False
    well = labware.Well(test_data[well_name], slot, well_name, has_tip)
    well_data = test_data[well_name]
    expected_x = well_data['x'] + slot.point.x
    expected_y = well_data['y'] + slot.point.y
    expected_z = well_data['z'] + well_data['depth'] + slot.point.z
    assert well.top() == Location(Point(expected_x, expected_y, expected_z),
                                  well)


def test_bottom():
    slot = Location(Point(7, 8, 9), 1)
    well_name = 'rectangular_well_json'
    has_tip = False
    well = labware.Well(test_data[well_name], slot, well_name, has_tip)
    well_data = test_data[well_name]
    expected_x = well_data['x'] + slot.point.x
    expected_y = well_data['y'] + slot.point.y
    expected_z = well_data['z'] + slot.point.z
    assert well.bottom() == Location(Point(expected_x, expected_y, expected_z),
                                     well)


def test_from_center_cartesian():
    slot1 = Location(Point(10, 11, 12), 1)
    well_name = 'circular_well_json'
    has_tip = False
    well1 = labware.Well(test_data[well_name], slot1, well_name, has_tip)

    percent1_x = 1
    percent1_y = 1
    percent1_z = -0.5
    point1 = well1._from_center_cartesian(percent1_x, percent1_y, percent1_z)

    # slot.x + well.x + 1 * well.diamter/2
    expected_x = 10 + 40 + 15
    # slot.y + well.y + 1 * well.diamter/2
    expected_y = 11 + 50 + 15
    # slot.z + well.z + (1 - 0.5) * well.depth/2
    expected_z = 12 + 3 + 20 - 10

    assert point1.x == expected_x
    assert point1.y == expected_y
    assert point1.z == expected_z

    slot2 = Location(Point(13, 14, 15), 1)
    well2_name = 'rectangular_well_json'
    has_tip = False
    well2 = labware.Well(test_data[well2_name], slot2, well2_name, has_tip)
    percent2_x = -0.25
    percent2_y = 0.1
    percent2_z = 0.9
    point2 = well2._from_center_cartesian(percent2_x, percent2_y, percent2_z)

    # slot.x + well.x - 0.25 * well.width/2
    expected_x = 13 + 45 - 15
    # slot.y + well.y + 0.1 * well.length/2
    expected_y = 14 + 10 + 2.5
    # slot.z + well.z + (1 + 0.9) * well.depth/2
    expected_z = 15 + 22 + 19

    assert point2.x == expected_x
    assert point2.y == expected_y
    assert point2.z == expected_z


def test_backcompat():
    labware_name = 'generic_96_wellPlate_380_uL'
    labware_def = labware._load_definition_by_name(labware_name)
    lw = labware.Labware(labware_def, Location(Point(0, 0, 0), 'Test Slot'))

    # Note that this test uses the display name of wells to test for equality,
    # because dimensional parameters could be subject to modification through
    # calibration, whereas here we are testing for "identity" in a way that is
    # related to the combination of well name, labware name, and slot name
    well_a1_name = repr(lw.wells_by_index()['A1'])
    well_b2_name = repr(lw.wells_by_index()['B2'])
    well_c3_name = repr(lw.wells_by_index()['C3'])

    w0 = lw[0]
    assert repr(w0) == well_a1_name

    w1 = lw['A1']
    assert repr(w1) == well_a1_name

    w2 = lw.well(0)
    assert repr(w2) == well_a1_name

    w3 = lw.well('A1')
    assert repr(w3) == well_a1_name

    w4 = lw.wells('B2')
    assert repr(w4[0]) == well_b2_name

    w5 = lw.wells(9, 21, 25, 27)
    assert len(w5) == 4
    assert repr(w5[0]) == well_b2_name

    w6 = lw.wells('A1', 'B2', 'C3')
    assert all([
        repr(well[0]) == well[1]
        for well in zip(w6, [well_a1_name, well_b2_name, well_c3_name])])

    w7 = lw.rows('A')
    assert len(w7) == 1
    assert repr(w7[0][0]) == well_a1_name

    w8 = lw.rows('A', 'C')
    assert len(w8) == 2
    assert repr(w8[0][0]) == well_a1_name
    assert repr(w8[1][2]) == well_c3_name

    w9 = lw.cols('2')
    assert len(w9) == 1
    assert len(w9[0]) == len(labware_def['ordering'][1])
    assert repr(w9[0][1]) == well_b2_name

    w10 = lw.cols('2', '5')
    assert len(w10) == 2
    assert repr(w10[0][1]) == well_b2_name

    w11 = lw.columns('2', '3', '6')
    assert len(w11) == 3
    assert repr(w11[1][2]) == well_c3_name


def test_well_parent():
    labware_name = 'generic_96_wellPlate_380_uL'
    labware_def = labware._load_definition_by_name(labware_name)
    lw = labware.Labware(labware_def, Location(Point(0, 0, 0), 'Test Slot'))
    parent = Location(Point(7, 8, 9), lw)
    well_name = 'circular_well_json'
    has_tip = True
    well = labware.Well(test_data[well_name],
                        parent,
                        well_name,
                        has_tip)
    assert well.parent is lw
    assert well.top().labware is well
    assert well.top().labware.parent is lw
    assert well.bottom().labware is well
    assert well.bottom().labware.parent is lw
    assert well.center().labware is well
    assert well.center().labware.parent is lw


def test_tip_tracking_init():
    labware_name = 'Opentrons_96_tiprack_300_uL'
    labware_def = labware._load_definition_by_name(labware_name)
    tiprack = labware.Labware(labware_def,
                              Location(Point(0, 0, 0), 'Test Slot'))
    assert tiprack.is_tiprack
    for well in tiprack.wells():
        assert well.has_tip

    labware_name = 'generic_96_wellPlate_380_uL'
    labware_def = json.loads(
        pkgutil.get_data('opentrons',
                         'shared_data/definitions2/{}.json'.format(
                             labware_name)))
    lw = labware.Labware(labware_def, Location(Point(0, 0, 0), 'Test Slot'))
    assert not lw.is_tiprack
    for well in lw.wells():
        assert not well.has_tip


def test_use_tips():
    labware_name = 'Opentrons_96_tiprack_300_uL'
    labware_def = labware._load_definition_by_name(labware_name)
    tiprack = labware.Labware(labware_def,
                              Location(Point(0, 0, 0), 'Test Slot'))
    well_list = tiprack.wells()

    # Test only using one tip
    tiprack.use_tips(well_list[0])
    assert not well_list[0].has_tip
    for well in well_list[1:]:
        assert well.has_tip

    # Test using a whole column
    tiprack.use_tips(well_list[8], num_channels=8)
    for well in well_list[8:16]:
        assert not well.has_tip
    assert well_list[7].has_tip
    assert well_list[16].has_tip

    # Test using a partial column from the top
    tiprack.use_tips(well_list[16], num_channels=4)
    for well in well_list[16:20]:
        assert not well.has_tip
    for well in well_list[20:24]:
        assert well.has_tip

    # Test using a partial column where the number of tips that get picked up
    # is less than the number of channels (e.g.: an 8-channel pipette picking
    # up 4 tips from the bottom half of a column)
    tiprack.use_tips(well_list[28], num_channels=4)
    for well in well_list[24:28]:
        assert well.has_tip
    for well in well_list[28:32]:
        assert not well.has_tip
    for well in well_list[32:]:
        assert well.has_tip


def test_select_next_tip():
    labware_name = 'Opentrons_96_tiprack_300_uL'
    labware_def = labware._load_definition_by_name(labware_name)
    tiprack = labware.Labware(labware_def,
                              Location(Point(0, 0, 0), 'Test Slot'))
    well_list = tiprack.wells()

    next_one = tiprack.next_tip()
    assert next_one == well_list[0]
    next_five = tiprack.next_tip(5)
    assert next_five == well_list[0]
    next_eight = tiprack.next_tip(8)
    assert next_eight == well_list[0]
    next_nine = tiprack.next_tip(9)
    assert next_nine is None

    # A1 tip only has been used
    tiprack.use_tips(well_list[0])

    next_one = tiprack.next_tip()
    assert next_one == well_list[1]
    next_five = tiprack.next_tip(5)
    assert next_five == well_list[1]
    next_eight = tiprack.next_tip(8)
    assert next_eight == well_list[8]

    # 2nd column has also been used
    tiprack.use_tips(well_list[8], num_channels=8)

    next_one = tiprack.next_tip()
    assert next_one == well_list[1]
    next_five = tiprack.next_tip(5)
    assert next_five == well_list[1]
    next_eight = tiprack.next_tip(8)
    assert next_eight == well_list[16]

    # Bottom 4 tips of 1rd column are also used
    tiprack.use_tips(well_list[4], num_channels=4)

    next_one = tiprack.next_tip()
    assert next_one == well_list[1]
    next_three = tiprack.next_tip(3)
    assert next_three == well_list[1]
    next_five = tiprack.next_tip(5)
    assert next_five == well_list[16]
    next_eight = tiprack.next_tip(8)
    assert next_eight == well_list[16]


def test_module_load():
    module_names = ['tempdeck', 'magdeck']
    module_defs = json.loads(
        pkgutil.get_data('opentrons',
                         'shared_data/robot-data/moduleSpecs.json'))
    for name in module_names:
        mod = labware.load_module(name, Location(Point(0, 0, 0), 'test'))
        mod_def = module_defs[name]
        offset = Point(mod_def['labwareOffset']['x'],
                       mod_def['labwareOffset']['y'],
                       mod_def['labwareOffset']['z'])
        high_z = mod_def['dimensions']['bareOverallHeight']
        assert mod.highest_z == high_z
        assert mod.location.point == offset
        mod = labware.load_module(name, Location(Point(1, 2, 3), 'test'))
        assert mod.highest_z == high_z + 3
        assert mod.location.point == (offset + Point(1, 2, 3))
        mod2 = labware.load_module_from_definition(mod_def,
                                                   Location(Point(3, 2, 1),
                                                            'test2'))
        assert mod2.highest_z == high_z + 1
        assert mod2.location.point == (offset + Point(3, 2, 1))


def test_module_load_labware():
    module_names = ['tempdeck', 'magdeck']
    labware_name = 'generic_96_wellPlate_380_uL'
    labware_def = labware._load_definition_by_name(labware_name)
    for name in module_names:
        mod = labware.load_module(name, Location(Point(0, 0, 0), 'test'))
        old_z = mod.highest_z
        lw = labware.load_from_definition(labware_def, mod.location)
        mod.add_labware(lw)
        assert mod.labware == lw
        assert mod.highest_z ==\
            (mod.location.point.z
             + labware_def['dimensions']['overallHeight']
             + mod._over_labware)
        with pytest.raises(AssertionError):
            mod.add_labware(lw)
        mod.reset_labware()
        assert mod.labware is None
        assert mod.highest_z == old_z
