import os
import json
import tempfile
from opentrons.data_storage import labware_definitions as ldef

file_dir = os.path.abspath(os.path.dirname(__file__))

test_defn_root = os.path.abspath(os.path.join(
    file_dir, '..', '..', '..', '..', 'labware-definitions', 'definitions'))
test_user_defn_root = os.path.abspath(os.path.join(
    file_dir, '..', 'data', 'labware-def'))
test_definition_dir = os.path.join(
    test_user_defn_root, 'definitions')
test_offset_dir = os.path.join(
    test_user_defn_root, 'offsets')

test_lw_name = '4-well-plate'
expected_x = 40
expected_y = 40
expected_z = 30
expected_x_offset = 10
expected_y_offset = -10
expected_z_offset = 100

expected_final_x = expected_x + expected_x_offset
expected_final_y = expected_y + expected_y_offset
expected_final_z = expected_z + expected_z_offset


def test_load_definition():
    container_json = ldef._load_definition(test_definition_dir, test_lw_name)
    print(type(container_json))
    wells = container_json['wells']
    assert len(wells) == 4
    assert wells['A1']['x'] == expected_x
    assert wells['A1']['y'] == expected_y
    assert wells['A1']['z'] == expected_z

    assert container_json['ordering'][0] == ['A1', 'B1']


def test_load_offset():
    offset_json = ldef._load_offset(test_offset_dir, test_lw_name)
    assert offset_json['x'] == expected_x_offset
    assert offset_json['y'] == expected_y_offset
    assert offset_json['z'] == expected_z_offset


def test_load_labware():
    # Tests for finding definition and offset file in user definition dir
    lw = ldef._load(test_defn_root, test_user_defn_root, test_lw_name)
    assert lw['wells']['A1']['x'] == expected_final_x
    assert lw['wells']['A1']['y'] == expected_final_y
    assert lw['wells']['A1']['z'] == expected_final_z

    # Tests for finding definition in default dir and no offset file
    real_lw_name = '6-well-plate'
    real_lw = ldef._load(test_defn_root, test_user_defn_root, real_lw_name)
    assert real_lw['metadata']['name'] == real_lw_name


def test_list_labware():
    # Minor spot-checks, function is simple. Values will need to be updated if
    # labware is added to library
    lw = ldef.list_all_labware()
    assert len(lw) == 41
    assert lw[0] == '12-well-plate'
    assert lw[-1] == 'wheaton_vial_rack'


def test_save_offset():
    test_data = {'x': 1, 'y': 2, 'z': -3}
    test_dir = tempfile.mkdtemp()

    ldef._save_offset(test_dir, 'testy', test_data)

    files = os.listdir(test_dir)
    assert files == ['testy.json']

    with open(os.path.join(test_dir, 'testy.json')) as test_file:
        actual = json.load(test_file)
        assert actual == test_data


def test_save_user_definition():
    test_file_name = '4-well-plate.json'
    with open(os.path.join(
            test_user_defn_root, 'definitions', test_file_name)) as test_def:
        test_data = json.load(test_def)
    test_dir = tempfile.mkdtemp()

    ldef._save_user_definition(test_dir, test_data)

    files = os.listdir(test_dir)
    assert files == [test_file_name]

    with open(os.path.join(test_dir, test_file_name)) as test_file:
        actual = json.load(test_file)
        assert actual == test_data
