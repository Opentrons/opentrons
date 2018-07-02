import os
import json
import tempfile
from opentrons.data_storage import labware_definitions as ldef
from opentrons.data_storage import database
from opentrons.config import get_config_index

file_dir = os.path.abspath(os.path.dirname(__file__))

defn_dir = os.path.abspath(
    get_config_index().get('labware', {}).get('baseDefinitionDir', ''))
user_defn_dir = os.path.abspath(
    get_config_index().get('labware', {}).get('userDefinitionDir', ''))
offset_dir = os.path.abspath(
    get_config_index().get('labware', {}).get('offsetDir', ''))

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
    container_json = ldef._load_definition(user_defn_dir, test_lw_name)
    print(type(container_json))
    wells = container_json['wells']
    assert len(wells) == 4
    assert wells['A1']['x'] == expected_x
    assert wells['A1']['y'] == expected_y
    assert wells['A1']['z'] == expected_z

    assert container_json['ordering'][0] == ['A1', 'B1']


def test_load_offset():
    offset_json = ldef._load_offset(offset_dir, test_lw_name)
    assert offset_json['x'] == expected_x_offset
    assert offset_json['y'] == expected_y_offset
    assert offset_json['z'] == expected_z_offset


def test_load_labware():
    # Tests for finding definition and offset file in user definition dir
    lw = ldef._load(
        defn_dir, user_defn_dir, test_lw_name, offset_dir, with_offset=True)
    assert lw['wells']['A1']['x'] == expected_final_x
    assert lw['wells']['A1']['y'] == expected_final_y
    assert lw['wells']['A1']['z'] == expected_final_z

    # Tests for finding definition in default dir and no offset file
    real_lw_name = '6-well-plate'
    real_lw = ldef._load(
        defn_dir, user_defn_dir, real_lw_name, offset_dir, with_offset=True)
    assert real_lw['metadata']['name'] == real_lw_name


def test_load_without_offset():
    # Tests for loading definition without offset, even if offset file exists
    lw = ldef._load(
        defn_dir, user_defn_dir, test_lw_name, offset_dir, with_offset=False)
    assert lw['wells']['A1']['x'] == expected_x
    assert lw['wells']['A1']['y'] == expected_y
    assert lw['wells']['A1']['z'] == expected_z


def test_list_labware():
    # Minor spot-checks, function is simple. Values will need to be updated if
    # labware is added to library
    lw = ldef.list_all_labware()
    assert len(lw) == 44
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
            user_defn_dir, test_file_name)) as test_def:
        test_data = json.load(test_def)
    test_dir = tempfile.mkdtemp()

    ldef._save_user_definition(test_dir, test_data)

    files = os.listdir(test_dir)
    assert files == [test_file_name]

    with open(os.path.join(test_dir, test_file_name)) as test_file:
        actual = json.load(test_file)
        assert actual == test_data


def test_labware_create(dummy_db):
    from opentrons import labware
    lw_name = '15-well-plate'
    if lw_name in labware.list():
        database.delete_container(lw_name)
    n_cols = 5
    n_rows = 3
    col_space = 12
    row_space = 18
    diameter = 5
    height = 20
    volume = 3.14 * (diameter / 2.0)**2
    res = labware.create(
        lw_name,
        (n_cols, n_rows),
        (col_space, row_space),
        diameter,
        height,
        volume)
    lw = database.load_container(lw_name)
    database.delete_container(lw_name)

    assert len(lw.wells()) is n_cols * n_rows
    for well in lw.wells():
        name = well.get_name()
        assert res[name].coordinates() == well.coordinates()
        for prop in ['height', 'diameter']:
            assert res[name].properties[prop] == well.properties[prop]
    assert lw.well("B5").coordinates() == (
        (n_cols - 1) * col_space, row_space, 0)
    assert lw.well("C3").coordinates() == (
        2 * col_space, 0, 0)


def test_new_labware_create(split_labware_def):
    from opentrons import labware
    lw_name = '15-well-plate'
    n_cols = 5
    n_rows = 3
    col_space = 12
    row_space = 18
    diameter = 5
    height = 20
    volume = 3.14 * (diameter / 2.0)**2
    res = labware.create(
        lw_name,
        (n_cols, n_rows),
        (col_space, row_space),
        diameter,
        height,
        volume)
    lw = database.load_container(lw_name)

    assert len(lw.wells()) is n_cols * n_rows
    for well in lw.wells():
        name = well.get_name()
        assert res[name].coordinates() == well.coordinates()
        for prop in ['height', 'diameter']:
            assert res[name].properties[prop] == well.properties[prop]
    assert lw.well("B5").coordinates() == (
        (n_cols - 1) * col_space, row_space, 0)
    assert lw.well("C3").coordinates() == (
        2 * col_space, 0, 0)
