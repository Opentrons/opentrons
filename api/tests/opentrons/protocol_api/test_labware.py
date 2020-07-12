import json

import pytest

from opentrons.protocol_api import (
    labware, MAX_SUPPORTED_VERSION, module_geometry)

from opentrons_shared_data import load_shared_data
from opentrons.calibration_storage import (
    modify, helpers, get, delete, file_operators)
from opentrons.types import Point, Location
from opentrons.protocols.types import APIVersion
from opentrons.protocol_api.geometry import Deck

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


@pytest.fixture
def set_up_index_file(offset_tempdir):
    deck = Deck()
    labware_list = [
        'nest_96_wellplate_2ml_deep',
        'corning_384_wellplate_112ul_flat',
        'geb_96_tiprack_1000ul',
        'nest_12_reservoir_15ml']
    for idx, name in enumerate(labware_list):
        parent = deck.position_for(idx+1)
        definition = labware.get_labware_definition(name)
        lw = labware.Labware(definition, parent)
        modify.save_calibration(lw, Point(0, 0, 0))

    return labware_list


def test_well_init():
    slot = Location(Point(1, 2, 3), 1)
    well_name = 'circular_well_json'
    has_tip = False
    well1 = labware.Well(test_data[well_name], slot, well_name, has_tip,
                         MAX_SUPPORTED_VERSION)
    assert well1._diameter == test_data[well_name]['diameter']
    assert well1._length is None
    assert well1._width is None

    well2_name = 'rectangular_well_json'
    well2 = labware.Well(test_data[well2_name], slot, well2_name, has_tip,
                         MAX_SUPPORTED_VERSION)
    assert well2._diameter is None
    assert well2._length == test_data[well2_name]['xDimension']
    assert well2._width == test_data[well2_name]['yDimension']


def test_top():
    slot = Location(Point(4, 5, 6), 1)
    well_name = 'circular_well_json'
    has_tip = False
    well = labware.Well(test_data[well_name], slot, well_name, has_tip,
                        MAX_SUPPORTED_VERSION)
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
    well = labware.Well(test_data[well_name], slot, well_name, has_tip,
                        MAX_SUPPORTED_VERSION)
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
    well1 = labware.Well(test_data[well_name], slot1, well_name, has_tip,
                         MAX_SUPPORTED_VERSION)

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
                         MAX_SUPPORTED_VERSION)
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
    # calibration, whereas here we are testing for "identity" in a way that is
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
    well = labware.Well(test_data[well_name],
                        parent,
                        well_name,
                        has_tip,
                        MAX_SUPPORTED_VERSION)
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

    # you can reuse tips infinitely on api level 2.2
    tiprack.use_tips(well_list[0])
    tiprack.use_tips(well_list[0])

    # you can't on api level 2.1 or previous
    early_tr = labware.Labware(labware_def,
                               Location(Point(0, 0, 0), 'Test Slot'),
                               api_level=APIVersion(2, 1))
    early_tr.use_tips(well_list[0])
    with pytest.raises(AssertionError):
        early_tr.use_tips(well_list[0])


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


@pytest.mark.parametrize(
    'v1_module_name', ['tempdeck', 'magdeck', 'thermocycler'])
def test_module_load_v1(v1_module_name):
    module_defs = json.loads(
        load_shared_data('module/definitions/1.json'))
    model = module_geometry.resolve_module_model(v1_module_name)
    mod = module_geometry.load_module(
        model, Location(Point(0, 0, 0), 'test'))
    mod_def = module_defs[v1_module_name]
    offset = Point(mod_def['labwareOffset']['x'],
                   mod_def['labwareOffset']['y'],
                   mod_def['labwareOffset']['z'])
    high_z = mod_def['dimensions']['bareOverallHeight']
    assert mod.highest_z == high_z
    assert mod.location.point == offset
    mod = module_geometry.load_module(
        model, Location(Point(1, 2, 3), 'test'))
    assert mod.highest_z == high_z + 3
    assert mod.location.point == (offset + Point(1, 2, 3))
    mod2 = module_geometry.load_module_from_definition(
        module_defs[v1_module_name],
        Location(Point(3, 2, 1), 'test2'),
        module_geometry.ThermocyclerConfiguration.FULL)
    assert mod2.highest_z == high_z + 1
    assert mod2.location.point == (offset + Point(3, 2, 1))


@pytest.mark.parametrize(
    'module_model',
    list(module_geometry.MagneticModuleModel)
    + list(module_geometry.TemperatureModuleModel)
    + list(module_geometry.ThermocyclerModuleModel))
def test_module_load_v2(module_model):
    mod = module_geometry.load_module(
        module_model, Location(Point(0, 0, 0), '3'))
    mod_def = module_geometry._load_module_definition(MAX_SUPPORTED_VERSION,
                                                      module_model)
    high_z = mod_def['dimensions']['bareOverallHeight']
    assert mod.highest_z == high_z


@pytest.mark.parametrize(
    'module_name', [
        'tempdeck',
        'magdeck',
        'temperature module',
        'temperature module gen2',
        'thermocycler',
        'thermocycler module',
        'magnetic module',
        'magnetic module gen2',
        'magneticModuleV1',
        'magneticModuleV2',
        'temperatureModuleV1',
        'temperatureModuleV2',
        'thermocyclerModuleV1'
        ])
def test_module_load_labware(module_name):
    labware_name = 'corning_96_wellplate_360ul_flat'
    labware_def = labware.get_labware_definition(labware_name)
    model = module_geometry.resolve_module_model(module_name)
    mod = module_geometry.load_module(
        model, Location(Point(0, 0, 0), 'test'))
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


@pytest.mark.parametrize(
    'labware_name', [
        'nest_96_wellplate_2ml_deep',
        'corning_384_wellplate_112ul_flat',
        'geb_96_tiprack_1000ul',
        'nest_12_reservoir_15ml'])
def test_add_index_file(labware_name, index_file_dir):
    deck = Deck()
    parent = deck.position_for(1)
    definition = labware.get_labware_definition(labware_name)
    lw = labware.Labware(definition, parent)
    labware_hash = helpers._hash_labware_def(lw._definition)
    modify._add_to_index_offset_file(lw, labware_hash)

    lw_uri = labware.uri_from_definition(definition)

    str_parent = helpers._get_parent_identifier(lw.parent)
    slot = '1'
    if str_parent:
        mod_dict = {str_parent: f'{slot}-{str_parent}'}
    else:
        mod_dict = {}
    full_id = f'{labware_hash}{str_parent}'
    blob = {
            "uri": f'{lw_uri}',
            "slot": full_id,
            "module": mod_dict
        }

    lw_path = index_file_dir / 'index.json'
    info = file_operators._read_file(lw_path)
    assert info[full_id] == blob


def test_delete_one_calibration(set_up_index_file):
    lw_to_delete = 'nest_96_wellplate_2ml_deep'
    all_cals = get.get_all_calibrations()
    id_saved = ''

    def get_load_names(all_cals):
        nonlocal id_saved
        load_names = []
        for cal in all_cals:
            uri = cal.uri
            dets = helpers.details_from_uri(uri)
            if dets.load_name == lw_to_delete:
                id_saved = cal.labware_id
            load_names.append(dets.load_name)
        return load_names

    load_names = get_load_names(all_cals)

    assert lw_to_delete in load_names

    delete.delete_offset_file(id_saved)

    all_cals = get.get_all_calibrations()
    load_names = get_load_names(all_cals)

    assert lw_to_delete not in load_names
