import json
import pkgutil

import pytest

from opentrons.protocol_api import labware, MAX_SUPPORTED_VERSION
from opentrons.protocol_api.util import get_multi_well_set
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
        'xDimension': 120,
        'yDimension': 50,
        'x': 45,
        'y': 10,
        'z': 22
    }
}


def test_well_init():
    slot = Location(Point(1, 2, 3), 1)
    well_name = 'circular_well_json'
    has_tip = False
    well1 = labware.Well(well_props=test_data[well_name],
                         parent=slot,
                         display_name=well_name,
                         has_tip=has_tip,
                         starting_volume=0,
                         well_id=well_name,
                         api_level=MAX_SUPPORTED_VERSION)
    assert well1._diameter == test_data[well_name]['diameter']
    assert well1._x_dimension is None
    assert well1._y_dimension is None

    well2_name = 'rectangular_well_json'
    well2 = labware.Well(well_props=test_data[well2_name],
                         parent=slot,
                         display_name=well2_name,
                         has_tip=has_tip,
                         starting_volume=0,
                         well_id=well_name,
                         api_level=MAX_SUPPORTED_VERSION)
    assert well2._diameter is None
    assert well2._x_dimension == test_data[well2_name]['xDimension']
    assert well2._y_dimension == test_data[well2_name]['yDimension']


def test_top():
    slot = Location(Point(4, 5, 6), 1)
    well_name = 'circular_well_json'
    has_tip = False
    well = labware.Well(well_props=test_data[well_name],
                        parent=slot,
                        display_name=well_name,
                        has_tip=has_tip,
                        starting_volume=0,
                        well_id=well_name,
                        api_level=MAX_SUPPORTED_VERSION)
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
    well = labware.Well(well_props=test_data[well_name],
                        parent=slot,
                        display_name=well_name,
                        has_tip=has_tip,
                        starting_volume=0,
                        well_id=well_name,
                        api_level=MAX_SUPPORTED_VERSION)
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
    well1 = labware.Well(well_props=test_data[well_name],
                         parent=slot1,
                         display_name=well_name,
                         has_tip=has_tip,
                         starting_volume=0,
                         well_id=well_name,
                         api_level=MAX_SUPPORTED_VERSION)

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
    well2 = labware.Well(test_data[well2_name], slot2, well2_name, has_tip,
                         starting_volume=0,
                         well_id=well_name,
                         api_level=MAX_SUPPORTED_VERSION)
    percent2_x = -0.25
    percent2_y = 0.1
    percent2_z = 0.9
    point2 = well2._from_center_cartesian(percent2_x, percent2_y, percent2_z)

    # slot.x + well.x - 0.25 * well.length/2
    expected_x = 13 + 45 - 15
    # slot.y + well.y + 0.1 * well.width/2
    expected_y = 14 + 10 + 2.5
    # slot.z + well.z + (1 + 0.9) * well.depth/2
    expected_z = 15 + 22 + 19

    assert point2.x == expected_x
    assert point2.y == expected_y
    assert point2.z == expected_z


def test_back_compat():
    labware_name = 'corning_96_wellplate_360ul_flat'
    labware_def = labware.get_labware_definition(labware_name)
    lw = labware.Labware(labware_def, Location(Point(0, 0, 0), 'Test Slot'))

    # Note that this test uses the display name of wells to test for equality,
    # because dimensional parameters could be subject to modification through
    # calibration, whereas here we are testing for 'identity' in a way that is
    # related to the combination of well name, labware name, and slot name
    well_a1_name = repr(lw.wells_by_name()['A1'])
    well_b2_name = repr(lw.wells_by_name()['B2'])
    well_c3_name = repr(lw.wells_by_name()['C3'])

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

    w11 = lw.columns('2', '3', '6')
    assert len(w11) == 3
    assert repr(w11[1][2]) == well_c3_name


def test_well_parent():
    labware_name = 'corning_96_wellplate_360ul_flat'
    labware_def = labware.get_labware_definition(labware_name)
    lw = labware.Labware(labware_def, Location(Point(0, 0, 0), 'Test Slot'))
    parent = Location(Point(7, 8, 9), lw)
    well_name = 'circular_well_json'
    has_tip = True
    well = labware.Well(well_props=test_data[well_name],
                        parent=parent,
                        display_name=well_name,
                        has_tip=has_tip,
                        starting_volume=0,
                        well_id=well_name,
                        api_level=MAX_SUPPORTED_VERSION)
    assert well.parent is lw
    assert well.top().labware is well
    assert well.top().labware.parent is lw
    assert well.bottom().labware is well
    assert well.bottom().labware.parent is lw
    assert well.center().labware is well
    assert well.center().labware.parent is lw


def test_tip_tracking_init():
    labware_name = 'opentrons_96_tiprack_300ul'
    labware_def = labware.get_labware_definition(labware_name)
    tiprack = labware.Labware(labware_def,
                              Location(Point(0, 0, 0), 'Test Slot'))
    assert tiprack.is_tiprack
    for well in tiprack.wells():
        assert well.has_tip

    labware_name = 'corning_96_wellplate_360ul_flat'
    labware_def = labware.get_labware_definition(labware_name)
    lw = labware.Labware(labware_def, Location(Point(0, 0, 0), 'Test Slot'))
    assert not lw.is_tiprack
    for well in lw.wells():
        assert not well.has_tip


def test_use_tips():
    labware_name = 'opentrons_96_tiprack_300ul'
    labware_def = labware.get_labware_definition(labware_name)
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
    labware_name = 'opentrons_96_tiprack_300ul'
    labware_def = labware.get_labware_definition(labware_name)
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


def test_previous_tip():
    labware_name = 'opentrons_96_tiprack_300ul'
    labware_def = labware.get_labware_definition(labware_name)
    tiprack = labware.Labware(labware_def,
                              Location(Point(0, 0, 0), 'Test Slot'))
    # If all wells are used, we can't get a previous tip
    assert tiprack.previous_tip() is None
    # If one well is empty, wherever it is, we can get a slot
    tiprack.wells()[5].has_tip = False
    assert tiprack.previous_tip() is tiprack.wells()[5]
    # But not if we ask for more slots than are available
    assert tiprack.previous_tip(2) is None
    tiprack.wells()[7].has_tip = False
    # And those available wells have to be contiguous
    assert tiprack.previous_tip(2) is None
    # But if they are, we're good
    tiprack.wells()[6].has_tip = False
    assert tiprack.previous_tip(3) is tiprack.wells()[5]


def test_return_tips():
    labware_name = 'opentrons_96_tiprack_300ul'
    labware_def = labware.get_labware_definition(labware_name)
    tiprack = labware.Labware(labware_def,
                              Location(Point(0, 0, 0), 'Test Slot'))
    # If all wells are used, we get an error if we try to return
    with pytest.raises(AssertionError):
        tiprack.return_tips(tiprack.wells()[0])
    # If we have space where we specify, everything is OK
    tiprack.wells()[0].has_tip = False
    tiprack.return_tips(tiprack.wells()[0])
    assert tiprack.wells()[0].has_tip
    # We have to have enough space
    tiprack.wells()[0].has_tip = False
    with pytest.raises(AssertionError):
        tiprack.return_tips(tiprack.wells()[0], 2)
    # But we can drop stuff off the end of a column
    tiprack.wells()[7].has_tip = False
    tiprack.wells()[8].has_tip = False
    tiprack.return_tips(tiprack.wells()[7], 2)
    assert tiprack.wells()[7].has_tip
    # But we won't wrap around
    assert not tiprack.wells()[8].has_tip


def test_module_load():
    module_names = ['tempdeck', 'magdeck']
    module_defs = json.loads(
        pkgutil.get_data('opentrons',
                         'shared_data/module/definitions/1.json'))
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
    labware_name = 'corning_96_wellplate_360ul_flat'
    labware_def = labware.get_labware_definition(labware_name)
    for name in module_names:
        mod = labware.load_module(name, Location(Point(0, 0, 0), 'test'))
        old_z = mod.highest_z
        lw = labware.load_from_definition(labware_def, mod.location)
        mod.add_labware(lw)
        assert mod.labware == lw
        assert mod.highest_z ==\
            (mod.location.point.z
             + labware_def['dimensions']['zDimension']
             + mod._over_labware)
        with pytest.raises(AssertionError):
            mod.add_labware(lw)
        mod.reset_labware()
        assert mod.labware is None
        assert mod.highest_z == old_z


def test_tiprack_list():
    labware_name = 'opentrons_96_tiprack_300ul'
    labware_def = labware.get_labware_definition(labware_name)
    tiprack = labware.Labware(labware_def,
                              Location(Point(0, 0, 0), 'Test Slot'))
    tiprack_2 = labware.Labware(labware_def,
                                Location(Point(0, 0, 0), 'Test Slot'))

    assert labware.select_tiprack_from_list(
        [tiprack], 1) == (tiprack, tiprack['A1'])

    assert labware.select_tiprack_from_list(
        [tiprack], 1, tiprack.wells()[1]) == (tiprack, tiprack['B1'])

    tiprack['C1'].has_tip = False
    assert labware.select_tiprack_from_list(
        [tiprack], 1, tiprack.wells()[2]) == (tiprack, tiprack['D1'])

    tiprack['H12'].has_tip = False
    tiprack_2['A1'].has_tip = False
    assert labware.select_tiprack_from_list(
        [tiprack, tiprack_2], 1, tiprack.wells()[95]) == (
            tiprack_2, tiprack_2['B1'])

    with pytest.raises(labware.OutOfTipsError):
        labware.select_tiprack_from_list(
            [tiprack], 1, tiprack.wells()[95])


def test_uris():
    details = ('opentrons', 'opentrons_96_tiprack_300ul', '1')
    uri = 'opentrons/opentrons_96_tiprack_300ul/1'
    assert labware.uri_from_details(*details) == uri
    defn = labware.get_labware_definition(details[1], details[0], details[2])
    assert labware.uri_from_definition(defn) == uri
    lw = labware.Labware(defn, Location(Point(0, 0, 0), 'Test Slot'))
    assert lw.uri == uri


def test_initialize_volume():
    def_96 = labware.get_labware_definition('corning_96_wellplate_360ul_flat')
    a_one_vol = 200
    h_twelve_vol = 30

    # load labware with initial volumes by well
    lw_96 = labware.Labware(definition=def_96,
                            parent=Location(Point(0, 0, 0), 'Test Slot'),
                            volume_by_well={'A1': a_one_vol,
                                            'H12': h_twelve_vol})
    assert lw_96.volume_by_well.get('A1') == a_one_vol
    assert lw_96.volume_by_well.get('H12') == h_twelve_vol

    # mutate labware well volumes after loading
    extra = 20
    for well in lw_96.wells():
        well.volume = well.volume + extra
    assert lw_96.volume_by_well.get('A1') == a_one_vol + extra
    assert lw_96.volume_by_well.get('H12') == h_twelve_vol + extra
    assert lw_96.volume_by_well.get('B1') == extra


def test_multi_well_set():
    channel_count = 8

    # well sets for 96 well plate
    def_96 = labware.get_labware_definition('corning_96_wellplate_360ul_flat')
    lw_96 = labware.Labware(def_96, Location(Point(0, 0, 0), 'Test Slot'))
    well_sets_96 = [['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1'],
                    ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2'],
                    ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3'],
                    ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4'],
                    ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5'],
                    ['A6', 'B6', 'C6', 'D6', 'E6', 'F6', 'G6', 'H6'],
                    ['A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7', 'H7'],
                    ['A8', 'B8', 'C8', 'D8', 'E8', 'F8', 'G8', 'H8'],
                    ['A9', 'B9', 'C9', 'D9', 'E9', 'F9', 'G9', 'H9'],
                    ['A10', 'B10', 'C10', 'D10', 'E10', 'F10', 'G10', 'H10'],
                    ['A11', 'B11', 'C11', 'D11', 'E11', 'F11', 'G11', 'H11'],
                    ['A12', 'B12', 'C12', 'D12', 'E12', 'F12', 'G12', 'H12']]
    for well_set in well_sets_96:
        found_set = get_multi_well_set(
            back_well=lw_96.wells_by_name()[well_set[0]],
            channel_count=channel_count,
            wells=lw_96.wells(),
            labware_quirks=lw_96.quirks)
        found_ids = [w.well_id for w in found_set]
        assert found_ids == well_set

    # well sets for 12 column trough
    def_tr = labware.get_labware_definition(
        'usascientific_12_reservoir_22ml')
    lw_tr = labware.Labware(
        def_tr, Location(Point(0, 0, 0), 'Test Slot'))
    well_sets_tr = [['A1', 'A1', 'A1', 'A1', 'A1', 'A1', 'A1', 'A1'],
                    ['A2', 'A2', 'A2', 'A2', 'A2', 'A2', 'A2', 'A2'],
                    ['A3', 'A3', 'A3', 'A3', 'A3', 'A3', 'A3', 'A3'],
                    ['A4', 'A4', 'A4', 'A4', 'A4', 'A4', 'A4', 'A4'],
                    ['A5', 'A5', 'A5', 'A5', 'A5', 'A5', 'A5', 'A5'],
                    ['A6', 'A6', 'A6', 'A6', 'A6', 'A6', 'A6', 'A6'],
                    ['A7', 'A7', 'A7', 'A7', 'A7', 'A7', 'A7', 'A7'],
                    ['A8', 'A8', 'A8', 'A8', 'A8', 'A8', 'A8', 'A8'],
                    ['A9', 'A9', 'A9', 'A9', 'A9', 'A9', 'A9', 'A9'],
                    ['A10', 'A10', 'A10', 'A10', 'A10', 'A10', 'A10', 'A10'],
                    ['A11', 'A11', 'A11', 'A11', 'A11', 'A11', 'A11', 'A11'],
                    ['A12', 'A12', 'A12', 'A12', 'A12', 'A12', 'A12', 'A12']]

    for well_set in well_sets_tr:
        found_set = get_multi_well_set(
            back_well=lw_tr.wells_by_name()[well_set[0]],
            channel_count=channel_count,
            wells=lw_tr.wells(),
            labware_quirks=lw_tr.quirks)
        found_ids = [w.well_id for w in found_set]
        assert found_ids == well_set

    # well sets for 384 well plate
    def_384 = labware.get_labware_definition(
        'corning_384_wellplate_112ul_flat')
    lw_384 = labware.Labware(def_384, Location(Point(0, 0, 0), 'Test Slot'))
    well_sets_384 = [['A1', 'C1', 'E1', 'G1', 'I1', 'K1', 'M1', 'O1'],
                     ['B1', 'D1', 'F1', 'H1', 'J1', 'L1', 'N1', 'P1'],
                     ['A2', 'C2', 'E2', 'G2', 'I2', 'K2', 'M2', 'O2'],
                     ['B2', 'D2', 'F2', 'H2', 'J2', 'L2', 'N2', 'P2'],
                     ['A3', 'C3', 'E3', 'G3', 'I3', 'K3', 'M3', 'O3'],
                     ['B3', 'D3', 'F3', 'H3', 'J3', 'L3', 'N3', 'P3'],
                     ['A4', 'C4', 'E4', 'G4', 'I4', 'K4', 'M4', 'O4'],
                     ['B4', 'D4', 'F4', 'H4', 'J4', 'L4', 'N4', 'P4'],
                     ['A5', 'C5', 'E5', 'G5', 'I5', 'K5', 'M5', 'O5'],
                     ['B5', 'D5', 'F5', 'H5', 'J5', 'L5', 'N5', 'P5'],
                     ['A6', 'C6', 'E6', 'G6', 'I6', 'K6', 'M6', 'O6'],
                     ['B6', 'D6', 'F6', 'H6', 'J6', 'L6', 'N6', 'P6'],
                     ['A7', 'C7', 'E7', 'G7', 'I7', 'K7', 'M7', 'O7'],
                     ['B7', 'D7', 'F7', 'H7', 'J7', 'L7', 'N7', 'P7'],
                     ['A8', 'C8', 'E8', 'G8', 'I8', 'K8', 'M8', 'O8'],
                     ['B8', 'D8', 'F8', 'H8', 'J8', 'L8', 'N8', 'P8'],
                     ['A9', 'C9', 'E9', 'G9', 'I9', 'K9', 'M9', 'O9'],
                     ['B9', 'D9', 'F9', 'H9', 'J9', 'L9', 'N9', 'P9'],
                     ['A10', 'C10', 'E10', 'G10', 'I10', 'K10', 'M10', 'O10'],
                     ['B10', 'D10', 'F10', 'H10', 'J10', 'L10', 'N10', 'P10'],
                     ['A11', 'C11', 'E11', 'G11', 'I11', 'K11', 'M11', 'O11'],
                     ['B11', 'D11', 'F11', 'H11', 'J11', 'L11', 'N11', 'P11'],
                     ['A12', 'C12', 'E12', 'G12', 'I12', 'K12', 'M12', 'O12'],
                     ['B12', 'D12', 'F12', 'H12', 'J12', 'L12', 'N12', 'P12'],
                     ['A13', 'C13', 'E13', 'G13', 'I13', 'K13', 'M13', 'O13'],
                     ['B13', 'D13', 'F13', 'H13', 'J13', 'L13', 'N13', 'P13'],
                     ['A14', 'C14', 'E14', 'G14', 'I14', 'K14', 'M14', 'O14'],
                     ['B14', 'D14', 'F14', 'H14', 'J14', 'L14', 'N14', 'P14'],
                     ['A15', 'C15', 'E15', 'G15', 'I15', 'K15', 'M15', 'O15'],
                     ['B15', 'D15', 'F15', 'H15', 'J15', 'L15', 'N15', 'P15'],
                     ['A16', 'C16', 'E16', 'G16', 'I16', 'K16', 'M16', 'O16'],
                     ['B16', 'D16', 'F16', 'H16', 'J16', 'L16', 'N16', 'P16'],
                     ['A17', 'C17', 'E17', 'G17', 'I17', 'K17', 'M17', 'O17'],
                     ['B17', 'D17', 'F17', 'H17', 'J17', 'L17', 'N17', 'P17'],
                     ['A18', 'C18', 'E18', 'G18', 'I18', 'K18', 'M18', 'O18'],
                     ['B18', 'D18', 'F18', 'H18', 'J18', 'L18', 'N18', 'P18'],
                     ['A19', 'C19', 'E19', 'G19', 'I19', 'K19', 'M19', 'O19'],
                     ['B19', 'D19', 'F19', 'H19', 'J19', 'L19', 'N19', 'P19'],
                     ['A20', 'C20', 'E20', 'G20', 'I20', 'K20', 'M20', 'O20'],
                     ['B20', 'D20', 'F20', 'H20', 'J20', 'L20', 'N20', 'P20'],
                     ['A21', 'C21', 'E21', 'G21', 'I21', 'K21', 'M21', 'O21'],
                     ['B21', 'D21', 'F21', 'H21', 'J21', 'L21', 'N21', 'P21'],
                     ['A22', 'C22', 'E22', 'G22', 'I22', 'K22', 'M22', 'O22'],
                     ['B22', 'D22', 'F22', 'H22', 'J22', 'L22', 'N22', 'P22'],
                     ['A23', 'C23', 'E23', 'G23', 'I23', 'K23', 'M23', 'O23'],
                     ['B23', 'D23', 'F23', 'H23', 'J23', 'L23', 'N23', 'P23'],
                     ['A24', 'C24', 'E24', 'G24', 'I24', 'K24', 'M24', 'O24'],
                     ['B24', 'D24', 'F24', 'H24', 'J24', 'L24', 'N24', 'P24']]

    for well_set in well_sets_384:
        found_set = get_multi_well_set(
            back_well=lw_384.wells_by_name()[well_set[0]],
            channel_count=channel_count,
            wells=lw_384.wells(),
            labware_quirks=lw_384.quirks)
        found_ids = [w.well_id for w in found_set]
        assert found_ids == well_set
