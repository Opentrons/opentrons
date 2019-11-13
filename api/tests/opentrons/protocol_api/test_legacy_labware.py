import pytest
import shutil

from opentrons.legacy_api import containers
from opentrons.config import CONFIG
from opentrons.data_storage import database as db_cmds
from opentrons.protocol_api.legacy_wrapper.containers_wrapper import\
    LegacyLabware, perform_migration
from opentrons.protocol_api.labware import get_labware_definition, Labware
from opentrons.types import Point, Location


minimalLabwareDef = {
    "metadata": {
        "displayName": "minimal labware"
    },
    "cornerOffsetFromSlot": {
        "x": 0,
        "y": 0,
        "z": 0
    },
    "parameters": {
        "isTiprack": False,
        "isMagneticModuleCompatible": False
    },
    "ordering": [["A1", "B1"], ["A2", "B2"]],
    "wells": {
        "A1": {
          "depth": 40,
          "totalLiquidVolume": 100,
          "diameter": 30,
          "x": 0,
          "y": 0,
          "z": 0,
          "shape": "circular"
        },
        "B1": {
          "depth": 40,
          "totalLiquidVolume": 100,
          "diameter": 30,
          "x": 0,
          "y": 5,
          "z": 0,
          "shape": "circular"
        },
        "A2": {
          "depth": 40,
          "totalLiquidVolume": 100,
          "diameter": 30,
          "x": 10,
          "y": 0,
          "z": 0,
          "shape": "circular"
        },
        "B2": {
          "depth": 40,
          "totalLiquidVolume": 100,
          "diameter": 30,
          "x": 10,
          "y": 5,
          "z": 0,
          "shape": "circular"
        },
    },
    "dimensions": {
        "xDimension": 1.0,
        "yDimension": 2.0,
        "zDimension": 3.0
    }
}


@pytest.fixture
def minimal_labware():
    deck = Location(Point(0, 0, 0), 'deck')
    plate = LegacyLabware(Labware(minimalLabwareDef, deck))
    return plate


@pytest.fixture
def container_create(monkeypatch, config_tempdir):
    td, tempdb = config_tempdir
    fake_db = td.join('fakeopentrons.db')
    dest = shutil.copyfile(tempdb, fake_db)
    CONFIG['labware_database_file'] = dest
    containers.create(
        '3x8-chip',
        grid=(8, 3),
        spacing=(9, 7.75),
        diameter=5,
        depth=0,
        volume=20)

    def list_containers():
        return ['3x8-chip']
    monkeypatch.setattr(db_cmds, 'list_all_containers', list_containers)
    perform_migration()
    yield
    shutil.rmtree(CONFIG['labware_user_definitions_dir_v2']/'legacy_api')
    CONFIG['labware_database_file'] = tempdb


@pytest.mark.api2_only
def test_load_func(labware, container_create):
    with pytest.raises(FileNotFoundError):
        labware.load('fake_labware', slot=1)

    with pytest.raises(RuntimeWarning):
        labware.load('96-flat', slot=1, label='plate 1')
        labware.load('96-flat', slot=1, label='plate 2')

    with pytest.raises(RuntimeError):
        labware.load('tempdeck', slot=3)

    lw1 = labware.load('3x8-chip', slot=2)
    assert lw1.wells()[0].properties ==\
        {
        'depth': 0,
        'total-liquid-volume': 20,
        'diameter': 5,
        'length': None,
        'width': None,
        'height': 0,
        'has_tip': False,
        'shape': lw1.wells()[0].shape,
        'parent': lw1.wells()[0].parent}


@pytest.mark.api2_only
def test_well_accessor(minimal_labware):
    # Access well by __getitem__ from LegacyLabware
    assert minimal_labware[0] == minimal_labware._wells_by_index[0]
    assert minimal_labware['A1'] == minimal_labware._wells_by_index[0]

    # Access individual wells within a labware using wells method
    assert minimal_labware.wells()[0] == minimal_labware._wells_by_index[0]
    assert minimal_labware.wells()['A1'] == minimal_labware._wells_by_index[0]
    assert minimal_labware.wells(0) == minimal_labware._wells_by_index[0]
    assert minimal_labware.wells('A2') == minimal_labware._wells_by_name['A2']

    assert minimal_labware.well(1) == minimal_labware._wells_by_index[1]
    assert minimal_labware.well('A2') == minimal_labware._wells_by_name['A2']

    well_1 = minimal_labware._wells_by_index[0]
    well_2 = minimal_labware._wells_by_index[1]
    well_3 = minimal_labware._wells_by_name['A2']
    well_4 = minimal_labware._wells_by_name['B2']

    # Generate lists using `wells()` method
    assert minimal_labware.wells(0, 'A2') == [well_1, well_3]
    assert minimal_labware.wells(['A1', 2]) == [well_1, well_3]
    assert minimal_labware.wells(['A1', 'A2']) == [well_1, well_3]

    assert minimal_labware.wells(0, length=-2) == [well_1, well_4]
    assert minimal_labware.wells('A1', length=4, step=2)\
        == [well_1, well_3, well_1, well_3]

    assert minimal_labware.wells(x=1, y=1) == well_4
    assert minimal_labware.wells(x=-1) == [well_3, well_4]
    assert minimal_labware.wells(y=1) == [well_2, well_4]


@pytest.mark.api2_only
def test_row_accessor(minimal_labware):
    row_1 = [
        minimal_labware._wells_by_index[0],
        minimal_labware._wells_by_index[2]]
    row_2 = [
        minimal_labware._wells_by_index[1],
        minimal_labware._wells_by_index[3]]

    assert minimal_labware.rows[0] == row_1
    assert minimal_labware.rows['B'] == row_2

    assert minimal_labware.rows(0) == row_1
    assert minimal_labware.rows('A') == row_1
    assert minimal_labware.rows('A', 1) == [row_1, row_2]


@pytest.mark.api2_only
def test_column_accessor(minimal_labware):
    col_1 = [
        minimal_labware._wells_by_name['A1'],
        minimal_labware._wells_by_name['B1']]
    col_2 = [
        minimal_labware._wells_by_name['A2'],
        minimal_labware._wells_by_name['B2']]

    assert minimal_labware.columns[0] == col_1
    assert minimal_labware.cols[0] == col_1
    assert minimal_labware.columns['2'] == col_2
    assert minimal_labware.cols['2'] == col_2

    assert minimal_labware.columns(0) == col_1
    assert minimal_labware.columns('1') == col_1
    assert minimal_labware.columns('1', 1) == [col_1, col_2]

    assert minimal_labware.cols(0) == col_1
    assert minimal_labware.cols('1') == col_1
    assert minimal_labware.cols('1', 1) == [col_1, col_2]


@pytest.mark.api2_only
def test_list_labware(labware, container_create):
    # Although the API v2 name adheres to schema standards, backcompat
    # labware list should handle checking the old name against the list
    # of new labwares; this is why labware list uses a modified list class
    assert '3x8-chip' in labware.list()


@pytest.mark.api2_only
def test_properties(minimal_labware):
    dims = minimalLabwareDef['dimensions']
    first_well = minimalLabwareDef['wells']['A1']
    # Check labware properties
    assert minimal_labware.properties['length'] == dims['xDimension']
    assert minimal_labware.properties['width'] == dims['yDimension']
    assert minimal_labware.properties['height'] == dims['zDimension']

    # Check well properties
    assert minimal_labware[0].properties['total-liquid-volume']\
        == first_well['totalLiquidVolume']
    assert minimal_labware[0].properties['depth'] == first_well['depth']


@pytest.mark.api2_only
def test_labware_create(labware, container_create):
    migrated_json_def = get_labware_definition(
        '3x8_chip',
        namespace='legacy_api',
        version=1)

    labware.create(
        '3x8-chip-new',
        grid=(8, 3),
        spacing=(9, 7.75),
        diameter=5,
        depth=0,
        volume=20)

    new_created_def = get_labware_definition(
        '3x8_chip_new',
        namespace='custom_beta',
        version=1)

    assert migrated_json_def['wells'] == new_created_def['wells']
    lw_obj = labware.load('3x8_chip_new', slot=2)
    assert lw_obj.wells()[0].properties ==\
        {'depth': 0, 'total-liquid-volume': 20, 'diameter': 5,
         'width': None, 'length': None, 'height': 0, 'has_tip': False,
         'shape': lw_obj.wells()[0].shape,
         'parent': lw_obj.wells()[0].parent}


@pytest.mark.api2_only
def test_legacy_wells(minimal_labware):
    well = minimal_labware.wells()[2]
    well_def = minimalLabwareDef['wells']['A2']
    assert well.top().point ==\
        Point(well_def['x'], well_def['y'], well_def['depth'])
    assert well.center().point ==\
        Point(well_def['x'], well_def['y'], well_def['depth']/2)
    assert well.bottom().point ==\
        Point(well_def['x'], well_def['y'], 0)


@pytest.mark.api2_only
def test_load_labware_on_module(labware, modules):
    td = modules.load('tempdeck', 1)
    plate = labware.load('96-flat', 1, share=True)
    assert td._ctx.labware is plate.lw_obj

    md = modules.load('magdeck', 2)
    plate2 = labware.load('96-flat', 2, share=True)
    assert md._ctx.labware is plate2.lw_obj
