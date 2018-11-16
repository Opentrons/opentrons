from opentrons.protocol_api import labware
from opentrons.types import Point, Location

minimalLabwareDef = {
    "metadata": {
        "displayName": "minimal labware"
    },
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
    },
    "dimensions": {
        "overallLength": 1.0,
        "overallWidth": 2.0,
        "overallHeight": 3.0
    }
}

minimalLabwareDef2 = {
    "metadata": {
        "displayName": "other test labware"
    },
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
    },
    "dimensions": {
        "overallLength": 1.0,
        "overallWidth": 2.0,
        "overallHeight": 3.0
    }
}


def test_labware_init():
    deck = Location(Point(0, 0, 0), 'deck')
    fake_labware = labware.Labware(minimalLabwareDef, deck)
    ordering = [well for col in minimalLabwareDef['ordering'] for well in col]
    assert fake_labware._ordering == ordering
    assert fake_labware._well_definition == minimalLabwareDef['wells']
    assert fake_labware._offset == Point(x=10, y=10, z=5)


def test_well_pattern():
    deck = Location(Point(0, 0, 0), 'deck')
    fake_labware = labware.Labware(minimalLabwareDef, deck)
    assert fake_labware._pattern.match('A1')
    assert fake_labware._pattern.match('A10')
    assert not fake_labware._pattern.match('A0')


def test_wells_accessor():
    deck = Location(Point(0, 0, 0), 'deck')
    fake_labware = labware.Labware(minimalLabwareDef, deck)
    depth1 = minimalLabwareDef['wells']['A1']['depth']
    depth2 = minimalLabwareDef['wells']['A2']['depth']
    x = minimalLabwareDef['wells']['A2']['x']
    y = minimalLabwareDef['wells']['A2']['y']
    offset = fake_labware._offset
    a1 = Point(x=offset[0], y=offset[1], z=offset[2] + depth1)
    a2 = Point(x=offset[0] + x, y=offset[1] + y, z=offset[2] + depth2)
    assert fake_labware.wells()[0]._position == a1
    assert fake_labware.wells()[1]._position == a2


def test_wells_index_accessor():
    deck = Location(Point(0, 0, 0), 'deck')
    fake_labware = labware.Labware(minimalLabwareDef, deck)
    depth1 = minimalLabwareDef['wells']['A1']['depth']
    depth2 = minimalLabwareDef['wells']['A2']['depth']
    x = minimalLabwareDef['wells']['A2']['x']
    y = minimalLabwareDef['wells']['A2']['y']
    offset = fake_labware._offset
    a1 = Point(x=offset[0], y=offset[1], z=offset[2] + depth1)
    a2 = Point(x=offset[0] + x, y=offset[1] + y, z=offset[2] + depth2)
    assert fake_labware.wells_by_index()['A1']._position == a1
    assert fake_labware.wells_by_index()['A2']._position == a2


def test_rows_accessor():
    deck = Location(Point(0, 0, 0), 'deck')
    fake_labware = labware.Labware(minimalLabwareDef2, deck)
    depth1 = minimalLabwareDef2['wells']['A1']['depth']
    x1 = minimalLabwareDef2['wells']['A1']['x']
    y1 = minimalLabwareDef2['wells']['A1']['y']
    depth2 = minimalLabwareDef2['wells']['B2']['depth']
    x2 = minimalLabwareDef2['wells']['B2']['x']
    y2 = minimalLabwareDef2['wells']['B2']['y']
    offset = fake_labware._offset
    a1 = Point(x=offset[0] + x1, y=offset[1] + y1, z=offset[2] + depth1)
    b2 = Point(x=offset[0] + x2, y=offset[1] + y2, z=offset[2] + depth2)
    assert fake_labware.rows()[0][0]._position == a1
    assert fake_labware.rows()[1][1]._position == b2


def test_row_index_accessor():
    deck = Location(Point(0, 0, 0), 'deck')
    fake_labware = labware.Labware(minimalLabwareDef2, deck)
    depth1 = minimalLabwareDef2['wells']['A1']['depth']
    x1 = minimalLabwareDef2['wells']['A1']['x']
    y1 = minimalLabwareDef2['wells']['A1']['y']
    depth2 = minimalLabwareDef2['wells']['B2']['depth']
    x2 = minimalLabwareDef2['wells']['B2']['x']
    y2 = minimalLabwareDef2['wells']['B2']['y']
    offset = fake_labware._offset
    a1 = Point(x=offset[0] + x1, y=offset[1] + y1, z=offset[2] + depth1)
    b2 = Point(x=offset[0] + x2, y=offset[1] + y2, z=offset[2] + depth2)
    assert fake_labware.rows_by_index()['A'][0]._position == a1
    assert fake_labware.rows_by_index()['B'][1]._position == b2


def test_cols_accessor():
    deck = Location(Point(0, 0, 0), 'deck')
    fake_labware = labware.Labware(minimalLabwareDef, deck)
    depth1 = minimalLabwareDef['wells']['A1']['depth']
    depth2 = minimalLabwareDef['wells']['A2']['depth']
    x = minimalLabwareDef['wells']['A2']['x']
    y = minimalLabwareDef['wells']['A2']['y']
    offset = fake_labware._offset
    a1 = Point(x=offset[0], y=offset[1], z=offset[2] + depth1)
    a2 = Point(x=offset[0] + x, y=offset[1] + y, z=offset[2] + depth2)
    assert fake_labware.columns()[0][0]._position == a1
    assert fake_labware.columns()[1][0]._position == a2


def test_col_index_accessor():
    deck = Location(Point(0, 0, 0), 'deck')
    fake_labware = labware.Labware(minimalLabwareDef, deck)
    depth1 = minimalLabwareDef['wells']['A1']['depth']
    depth2 = minimalLabwareDef['wells']['A2']['depth']
    x = minimalLabwareDef['wells']['A2']['x']
    y = minimalLabwareDef['wells']['A2']['y']
    offset = fake_labware._offset
    a1 = Point(x=offset[0], y=offset[1], z=offset[2] + depth1)
    a2 = Point(x=offset[0] + x, y=offset[1] + y, z=offset[2] + depth2)
    assert fake_labware.columns_by_index()['1'][0]._position == a1
    assert fake_labware.columns_by_index()['2'][0]._position == a2
