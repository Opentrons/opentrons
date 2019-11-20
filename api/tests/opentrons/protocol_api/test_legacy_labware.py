import math
import pytest
import shutil

from numpy import isclose

from opentrons.legacy_api import containers
from opentrons.config import CONFIG
from opentrons.data_storage import database as db_cmds
from opentrons.protocol_api.legacy_wrapper.containers_wrapper import\
    LegacyLabware, perform_migration, LegacyWell
from opentrons.protocol_api.legacy_wrapper.types import LegacyLocation
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
        "isMagneticModuleCompatible": False,
        "loadName": "minimal_labware_def"
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


@pytest.fixture
def full_migration(config_tempdir):
    perform_migration()
    yield
    shutil.rmtree(CONFIG['labware_user_definitions_dir_v2']/'legacy_api')


@pytest.mark.api2_only
def test_sharing_chip(labware, container_create):
    labware_name = '3x8-chip'
    slot = labware._ctx.deck.position_for(1)
    older_labware = labware.load(labware_name, '1')
    stacked_labware_1 = labware.load(labware_name, '1', share=True)
    stacked_labware_2 = labware.load(labware_name, '1', share=True)
    stacked_labware_3 = labware.load(labware_name, '1', share=True)
    assert older_labware.parent == slot.labware
    assert stacked_labware_1.parent == slot.labware
    assert stacked_labware_2.parent == slot.labware
    assert stacked_labware_3.parent == slot.labware
    del labware._ctx._deck_layout['12']
    # sharing a slot shouldn't combine labware heights
    assert labware._ctx._deck_layout.highest_z == older_labware.highest_z
    del labware._ctx._deck_layout['1']


@pytest.mark.api2_only
def test_sharing_full_lw(labware, full_migration):
    for labware_name in labware.list():
        slot = labware._ctx.deck.position_for(1)
        older_labware = labware.load(labware_name, '1')
        stacked_labware_1 = labware.load(labware_name, '1', share=True)
        stacked_labware_2 = labware.load(labware_name, '1', share=True)
        stacked_labware_3 = labware.load(labware_name, '1', share=True)
        assert older_labware.parent == slot.labware
        assert stacked_labware_1.parent == slot.labware
        assert stacked_labware_2.parent == slot.labware
        assert stacked_labware_3.parent == slot.labware
        del labware._ctx._deck_layout['12']
        # sharing a slot shouldn't combine labware heights
        assert labware._ctx._deck_layout.highest_z == older_labware.highest_z
        del labware._ctx._deck_layout['1']


@pytest.mark.api2_only
def test_sharing_different_things(labware):
    slot = labware._ctx.deck.position_for(1)
    older_labware = labware.load('corning_96_wellplate_360ul_flat', '1')
    stacked_labware_1 = labware.load(
        'corning_96_wellplate_360ul_flat', '1', share=True)
    stacked_labware_2 = labware.load(
        'opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap',
        '1', share=True)
    stacked_labware_3 = labware.load(
        'corning_96_wellplate_360ul_flat', '1', share=True)
    assert older_labware.parent == slot.labware
    assert stacked_labware_1.parent == slot.labware
    assert stacked_labware_2.parent == slot.labware
    assert stacked_labware_3.parent == slot.labware
    del labware._ctx._deck_layout['12']
    # sharing a slot shouldn't combine labware heights
    assert labware._ctx._deck_layout.highest_z == stacked_labware_2.highest_z


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
    assert minimal_labware[0] == minimal_labware._wells_by_index()[0]
    assert minimal_labware['A1'] == minimal_labware._wells_by_index()[0]

    # Access individual wells within a labware using wells method
    assert minimal_labware.wells()[0] == minimal_labware._wells_by_index()[0]
    assert minimal_labware.wells()['A1']\
        == minimal_labware._wells_by_index()[0]
    assert minimal_labware.wells(0) == minimal_labware._wells_by_index()[0]
    assert minimal_labware.wells('A2')\
        == minimal_labware._wells_by_name()['A2']

    assert minimal_labware.well(1) == minimal_labware._wells_by_index()[1]
    assert minimal_labware.well('A2') == minimal_labware._wells_by_name()['A2']

    well_1 = minimal_labware._wells_by_index()[0]
    well_2 = minimal_labware._wells_by_index()[1]
    well_3 = minimal_labware._wells_by_name()['A2']
    well_4 = minimal_labware._wells_by_name()['B2']

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
        minimal_labware._wells_by_index()[0],
        minimal_labware._wells_by_index()[2]]
    row_2 = [
        minimal_labware._wells_by_index()[1],
        minimal_labware._wells_by_index()[3]]

    assert minimal_labware.rows[0] == row_1
    assert minimal_labware.rows['B'] == row_2

    assert minimal_labware.rows(0) == row_1
    assert minimal_labware.rows('A') == row_1
    assert minimal_labware.rows('A', 1) == [row_1, row_2]


@pytest.mark.api2_only
def test_column_accessor(minimal_labware):
    col_1 = [
        minimal_labware._wells_by_name()['A1'],
        minimal_labware._wells_by_name()['B1']]
    col_2 = [
        minimal_labware._wells_by_name()['A2'],
        minimal_labware._wells_by_name()['B2']]

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
    assert super(LegacyWell, well)._top().point ==\
        Point(well_def['x'], well_def['y'], well_def['depth'])
    assert super(LegacyWell, well)._center().point ==\
        Point(well_def['x'], well_def['y'], well_def['depth']/2)
    assert super(LegacyWell, well).bottom().point ==\
        Point(well_def['x'], well_def['y'], 0)


@pytest.mark.api2_only
def test_load_labware_on_module(labware, modules):
    td = modules.load('tempdeck', 1)
    plate = labware.load('96-flat', 1, share=True)
    assert td._ctx.labware is plate.lw_obj

    md = modules.load('magdeck', 2)
    plate2 = labware.load('96-flat', 2, share=True)
    assert md._ctx.labware is plate2.lw_obj


@pytest.mark.api2_only
def test_legacy_well_position(labware):
    wp = labware.load('corning_96_wellplate_360ul_flat', '2')
    # These numeric literals are taken from experimentation with loading this
    # labware into v1
    assert isinstance(wp[0].center(), LegacyLocation)
    assert wp[0].center().labware is wp[0]
    assert isclose(wp[0].center().offset,
                   Point(3.43, 3.43, 5.33),
                   atol=.005).all()

    assert isinstance(wp[0].top(), LegacyLocation)
    assert wp[0].top().labware is wp[0]
    assert isclose(wp[0].top().offset,
                   Point(3.43, 3.43, 10.67)).all()

    assert isinstance(wp[0].bottom(), LegacyLocation)
    assert wp[0].bottom().labware is wp[0]
    assert isclose(wp[0].bottom().offset,
                   Point(3.43, 3.43, 0)).all()
    # should be origin
    assert isclose(wp[0].from_center(-1, -1, -1).offset,
                   Point(0, 0, 0)).all()

    # should be another way to spell origin, but actually it's not because
    # the polar coordinates used in Placeable.from_polar are actually based
    # on an inscribed circle
    assert isclose(wp[0].from_center(r=1, theta=5*math.pi/4, h=-1).offset,
                   Point(1, 1, 0), atol=0.005).all()
    # this too
    assert isclose(wp[0].bottom(radius=1, degrees=225).offset,
                   Point(1, 1, 0), atol=0.005).all()

    # this too
    assert isclose(wp[0].top(radius=1, degrees=225).offset,
                   Point(1, 1, 10.67), atol=0.005).all()


def check_label_for_labware(labware):
    plate1 = labware.load('96-flat', slot=1, label='plate 1')
    plate2 = labware.load('96-flat', slot=2, label='plate 2')
    assert plate1.name == 'plate 1'
    assert plate2.name == 'plate 2'
