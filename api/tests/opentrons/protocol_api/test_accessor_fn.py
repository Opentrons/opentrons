import pytest
from opentrons.protocol_api import labware
from opentrons.types import Point, Location


@pytest.fixture
def minimal_labware_def():
    return {
        "metadata": {
            "displayName": "minimal labware"
        },
        "cornerOffsetFromSlot": {
            "x": 10,
            "y": 10,
            "z": 5
        },
        "parameters": {
            "isTiprack": False,
            "loadName": "minimal_labware_def"
        },
        "ordering": [["A1"], ["A2"]],
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
            "A2": {
              "depth": 40,
              "totalLiquidVolume": 100,
              "diameter": 30,
              "x": 10,
              "y": 0,
              "z": 0,
              "shape": "circular"
            }
        },
        "dimensions": {
            "xDimension": 1.0,
            "yDimension": 2.0,
            "zDimension": 3.0
        }
    }


@pytest.fixture
def minimal_labware_def2():
    return {
        "metadata": {
            "displayName": "other test labware"
        },
        "cornerOffsetFromSlot": {
                "x": 10,
                "y": 10,
                "z": 5
        },
        "parameters": {
            "isTiprack": False,
            "loadName": "minimal_labware_def"
        },
        "ordering": [["A1", "B1", "C1"], ["A2", "B2", "C2"]],
        "wells": {
            "A1": {
              "depth": 40,
              "totalLiquidVolume": 100,
              "diameter": 30,
              "x": 0,
              "y": 18,
              "z": 0,
              "shape": "circular"
            },
            "B1": {
              "depth": 40,
              "totalLiquidVolume": 100,
              "diameter": 30,
              "x": 0,
              "y": 9,
              "z": 0,
              "shape": "circular"
            },
            "C1": {
              "depth": 40,
              "totalLiquidVolume": 100,
              "diameter": 30,
              "x": 0,
              "y": 0,
              "z": 0,
              "shape": "circular"
            },
            "A2": {
              "depth": 40,
              "totalLiquidVolume": 100,
              "diameter": 30,
              "x": 9,
              "y": 18,
              "z": 0,
              "shape": "circular"
            },
            "B2": {
              "depth": 40,
              "totalLiquidVolume": 100,
              "diameter": 30,
              "x": 9,
              "y": 9,
              "z": 0,
              "shape": "circular"
            },
            "C2": {
              "depth": 40,
              "totalLiquidVolume": 100,
              "diameter": 30,
              "x": 9,
              "y": 0,
              "z": 0,
              "shape": "circular"
            }
        },
        "dimensions": {
            "xDimension": 1.0,
            "yDimension": 2.0,
            "zDimension": 3.0
        }
    }


@pytest.fixture
def min_lw_impl(minimal_labware_def) -> labware.LabwareImplementation:
    return labware.LabwareImplementation(
            definition=minimal_labware_def,
            parent=Location(Point(0, 0, 0), 'deck')
    )


@pytest.fixture
def min_lw2_impl(minimal_labware_def2) -> labware.LabwareImplementation:
    return labware.LabwareImplementation(
        definition=minimal_labware_def2,
        parent=Location(Point(0, 0, 0), 'deck')
    )


@pytest.fixture
def min_lw(min_lw_impl) -> labware.Labware:
    return labware.Labware(implementation=min_lw_impl)


@pytest.fixture
def min_lw2(min_lw2_impl) -> labware.Labware:
    return labware.Labware(implementation=min_lw2_impl)


def test_labware_init(min_lw_impl, minimal_labware_def):
    ordering = [well for col in minimal_labware_def['ordering']
                for well in col]
    assert min_lw_impl._ordering == ordering
    assert min_lw_impl._well_definition == minimal_labware_def['wells']
    assert min_lw_impl.get_geometry()._offset == Point(x=10, y=10, z=5)


def test_wells_accessor(min_lw, min_lw_impl, minimal_labware_def):
    depth1 = minimal_labware_def['wells']['A1']['depth']
    depth2 = minimal_labware_def['wells']['A2']['depth']
    x = minimal_labware_def['wells']['A2']['x']
    y = minimal_labware_def['wells']['A2']['y']
    offset = min_lw_impl.get_geometry()._offset
    a1 = Point(x=offset[0], y=offset[1], z=offset[2] + depth1)
    a2 = Point(x=offset[0] + x, y=offset[1] + y, z=offset[2] + depth2)
    assert min_lw.wells()[0].geometry._position == a1
    assert min_lw.wells()[1].geometry._position == a2


def test_wells_name_accessor(min_lw, min_lw_impl, minimal_labware_def):
    depth1 = minimal_labware_def['wells']['A1']['depth']
    depth2 = minimal_labware_def['wells']['A2']['depth']
    x = minimal_labware_def['wells']['A2']['x']
    y = minimal_labware_def['wells']['A2']['y']
    offset = min_lw_impl.get_geometry().offset
    a1 = Point(x=offset[0], y=offset[1], z=offset[2] + depth1)
    a2 = Point(x=offset[0] + x, y=offset[1] + y, z=offset[2] + depth2)
    assert min_lw.wells_by_name()['A1'].geometry._position == a1
    assert min_lw.wells_by_name()['A2'].geometry._position == a2


def test_deprecated_index_accessors(min_lw):
    assert min_lw.wells_by_name() == min_lw.wells_by_index()
    assert min_lw.rows_by_name() == min_lw.rows_by_index()
    assert min_lw.columns_by_name() == min_lw.columns_by_index()


def test_dict_accessor(min_lw, min_lw_impl, minimal_labware_def):
    depth1 = minimal_labware_def['wells']['A1']['depth']
    depth2 = minimal_labware_def['wells']['A2']['depth']
    x = minimal_labware_def['wells']['A2']['x']
    y = minimal_labware_def['wells']['A2']['y']
    offset = min_lw_impl.get_geometry().offset
    a1 = Point(x=offset[0], y=offset[1], z=offset[2] + depth1)
    a2 = Point(x=offset[0] + x, y=offset[1] + y, z=offset[2] + depth2)
    assert min_lw['A1'].geometry._position == a1
    assert min_lw['A2'].geometry._position == a2


def test_rows_accessor(min_lw2_impl, min_lw2, minimal_labware_def2):
    depth1 = minimal_labware_def2['wells']['A1']['depth']
    x1 = minimal_labware_def2['wells']['A1']['x']
    y1 = minimal_labware_def2['wells']['A1']['y']
    depth2 = minimal_labware_def2['wells']['B2']['depth']
    x2 = minimal_labware_def2['wells']['B2']['x']
    y2 = minimal_labware_def2['wells']['B2']['y']
    offset = min_lw2_impl.get_geometry().offset
    a1 = Point(x=offset[0] + x1, y=offset[1] + y1, z=offset[2] + depth1)
    b2 = Point(x=offset[0] + x2, y=offset[1] + y2, z=offset[2] + depth2)
    assert min_lw2.rows()[0][0].geometry._position == a1
    assert min_lw2.rows()[1][1].geometry._position == b2


def test_row_name_accessor(min_lw2_impl, min_lw2, minimal_labware_def2):
    depth1 = minimal_labware_def2['wells']['A1']['depth']
    x1 = minimal_labware_def2['wells']['A1']['x']
    y1 = minimal_labware_def2['wells']['A1']['y']
    depth2 = minimal_labware_def2['wells']['B2']['depth']
    x2 = minimal_labware_def2['wells']['B2']['x']
    y2 = minimal_labware_def2['wells']['B2']['y']
    offset = min_lw2_impl.get_geometry().offset
    a1 = Point(x=offset[0] + x1, y=offset[1] + y1, z=offset[2] + depth1)
    b2 = Point(x=offset[0] + x2, y=offset[1] + y2, z=offset[2] + depth2)
    assert min_lw2.rows_by_name()['A'][0].geometry._position == a1
    assert min_lw2.rows_by_name()['B'][1].geometry._position == b2


def test_cols_accessor(min_lw_impl, min_lw, minimal_labware_def):
    depth1 = minimal_labware_def['wells']['A1']['depth']
    depth2 = minimal_labware_def['wells']['A2']['depth']
    x = minimal_labware_def['wells']['A2']['x']
    y = minimal_labware_def['wells']['A2']['y']
    offset = min_lw_impl.get_geometry().offset
    a1 = Point(x=offset[0], y=offset[1], z=offset[2] + depth1)
    a2 = Point(x=offset[0] + x, y=offset[1] + y, z=offset[2] + depth2)
    assert min_lw.columns()[0][0].geometry._position == a1
    assert min_lw.columns()[1][0].geometry._position == a2


def test_col_name_accessor(min_lw, min_lw_impl, minimal_labware_def):
    depth1 = minimal_labware_def['wells']['A1']['depth']
    depth2 = minimal_labware_def['wells']['A2']['depth']
    x = minimal_labware_def['wells']['A2']['x']
    y = minimal_labware_def['wells']['A2']['y']
    offset = min_lw_impl.get_geometry().offset
    a1 = Point(x=offset[0], y=offset[1], z=offset[2] + depth1)
    a2 = Point(x=offset[0] + x, y=offset[1] + y, z=offset[2] + depth2)
    assert min_lw.columns_by_name()['1'][0].geometry._position == a1
    assert min_lw.columns_by_name()['2'][0].geometry._position == a2
