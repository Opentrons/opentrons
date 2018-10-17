from opentrons.protocol_api import labware
from opentrons.types import Point

minimalLabwareDef = {
    "cornerOffsetFromSlot": {
        "x": 10,
        "y": 10,
        "z": 5
    },
    "otId": "minimalLabwareDef",
    "parameters": {
        "isTiprack": False,
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
    }
}

minimalLabwareDef2 = {
    "cornerOffsetFromSlot": {
            "x": 10,
            "y": 10,
            "z": 5
    },
    "otId": "minimalLabwareDef2",
    "parameters": {
        "isTiprack": False,
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
    }
}


def test_labware_init():
    deck = Point(0, 0, 0)
    fakeLabware = labware.Labware(minimalLabwareDef, deck)
    ordering = [well for col in minimalLabwareDef['ordering'] for well in col]
    assert fakeLabware._ordering == ordering
    assert fakeLabware._well_definition == minimalLabwareDef['wells']
    assert fakeLabware._offset == Point(x=10, y=10, z=5)


def test_well_pattern():
    deck = Point(0, 0, 0)
    fakeLabware = labware.Labware(minimalLabwareDef, deck)
    assert fakeLabware._pattern.match('A1')
    assert fakeLabware._pattern.match('A10')
    assert not fakeLabware._pattern.match('A0')


def test_wells_accessor():
    deck = Point(0, 0, 0)
    fakeLabware = labware.Labware(minimalLabwareDef, deck)
    depth1 = minimalLabwareDef['wells']['A1']['depth']
    depth2 = minimalLabwareDef['wells']['A2']['depth']
    x = minimalLabwareDef['wells']['A2']['x']
    y = minimalLabwareDef['wells']['A2']['y']
    offset = fakeLabware._offset
    a1 = Point(x=offset[0], y=offset[1], z=offset[2] + depth1)
    a2 = Point(x=offset[0] + x, y=offset[1] + y, z=offset[2] + depth2)
    assert fakeLabware.wells()[0]._position == a1
    assert fakeLabware.wells()[1]._position == a2


def test_wells_index_accessor():
    deck = Point(0, 0, 0)
    fakeLabware = labware.Labware(minimalLabwareDef, deck)
    depth1 = minimalLabwareDef['wells']['A1']['depth']
    depth2 = minimalLabwareDef['wells']['A2']['depth']
    x = minimalLabwareDef['wells']['A2']['x']
    y = minimalLabwareDef['wells']['A2']['y']
    offset = fakeLabware._offset
    a1 = Point(x=offset[0], y=offset[1], z=offset[2] + depth1)
    a2 = Point(x=offset[0] + x, y=offset[1] + y, z=offset[2] + depth2)
    assert fakeLabware.wells_by_index()['A1']._position == a1
    assert fakeLabware.wells_by_index()['A2']._position == a2


def test_rows_accessor():
    deck = Point(0, 0, 0)
    fakeLabware = labware.Labware(minimalLabwareDef2, deck)
    depth1 = minimalLabwareDef2['wells']['A1']['depth']
    x1 = minimalLabwareDef2['wells']['A1']['x']
    y1 = minimalLabwareDef2['wells']['A1']['y']
    depth2 = minimalLabwareDef2['wells']['B2']['depth']
    x2 = minimalLabwareDef2['wells']['B2']['x']
    y2 = minimalLabwareDef2['wells']['B2']['y']
    offset = fakeLabware._offset
    a1 = Point(x=offset[0] + x1, y=offset[1] + y1, z=offset[2] + depth1)
    b2 = Point(x=offset[0] + x2, y=offset[1] + y2, z=offset[2] + depth2)
    assert fakeLabware.rows()[0][0]._position == a1
    assert fakeLabware.rows()[1][1]._position == b2


def test_row_index_accessor():
    deck = Point(0, 0, 0)
    fakeLabware = labware.Labware(minimalLabwareDef2, deck)
    depth1 = minimalLabwareDef2['wells']['A1']['depth']
    x1 = minimalLabwareDef2['wells']['A1']['x']
    y1 = minimalLabwareDef2['wells']['A1']['y']
    depth2 = minimalLabwareDef2['wells']['B2']['depth']
    x2 = minimalLabwareDef2['wells']['B2']['x']
    y2 = minimalLabwareDef2['wells']['B2']['y']
    offset = fakeLabware._offset
    a1 = Point(x=offset[0] + x1, y=offset[1] + y1, z=offset[2] + depth1)
    b2 = Point(x=offset[0] + x2, y=offset[1] + y2, z=offset[2] + depth2)
    assert fakeLabware.rows_by_index()['A'][0]._position == a1
    assert fakeLabware.rows_by_index()['B'][1]._position == b2


def test_cols_accessor():
    deck = Point(0, 0, 0)
    fakeLabware = labware.Labware(minimalLabwareDef, deck)
    depth1 = minimalLabwareDef['wells']['A1']['depth']
    depth2 = minimalLabwareDef['wells']['A2']['depth']
    x = minimalLabwareDef['wells']['A2']['x']
    y = minimalLabwareDef['wells']['A2']['y']
    offset = fakeLabware._offset
    a1 = Point(x=offset[0], y=offset[1], z=offset[2] + depth1)
    a2 = Point(x=offset[0] + x, y=offset[1] + y, z=offset[2] + depth2)
    assert fakeLabware.columns()[0][0]._position == a1
    assert fakeLabware.columns()[1][0]._position == a2


def test_col_index_accessor():
    deck = Point(0, 0, 0)
    fakeLabware = labware.Labware(minimalLabwareDef, deck)
    depth1 = minimalLabwareDef['wells']['A1']['depth']
    depth2 = minimalLabwareDef['wells']['A2']['depth']
    x = minimalLabwareDef['wells']['A2']['x']
    y = minimalLabwareDef['wells']['A2']['y']
    offset = fakeLabware._offset
    a1 = Point(x=offset[0], y=offset[1], z=offset[2] + depth1)
    a2 = Point(x=offset[0] + x, y=offset[1] + y, z=offset[2] + depth2)
    assert fakeLabware.columns_by_index()['1'][0]._position == a1
    assert fakeLabware.columns_by_index()['2'][0]._position == a2
