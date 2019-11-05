import pytest


from opentrons.protocol_api.legacy_wrapper.containers_wrapper import LegacyLabware
from opentrons.protocol_api import labware
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


# def test_lw_create():
#     return None
#
#

@pytest.fixture
def test_load_func():
    return None


def test_well_accessor():
    deck = Location(Point(0, 0, 0), 'deck')
    plate = LegacyLabware(minimalLabwareDef, deck)

    well_1 = plate._wells_by_index[0]
    well_2 = plate._wells_by_index[1]

    assert plate.wells == [well_1, well_2]
    assert plate.well['A1'] == well_1

    assert plate.wells() == [well_1, well_2]
    assert plate.wells(0) == well_1
    assert plate.wells('A2') == well_2
    assert plate.wells(0, 'A2') == [well_1, well_2]
    assert plate.wells(['A1', 1]) == [well_1, well_2]


def test_row_accessor():
    deck = Location(Point(0, 0, 0), 'deck')
    plate = LegacyLabware(minimalLabwareDef, deck)

    row_1 = [plate._wells_by_index[0], plate._wells_by_index[2]]
    row_2 = [plate._wells_by_index[1], plate._wells_by_index[3]]

    # assert plate.rows == [row_1, row_2]
    # assert plate.rows[0] == row_1
    # assert plate.rows['B'] == row_2

    assert plate.rows() == [row_1, row_2]
    assert plate.rows(0) == row_1
    assert plate.rows('A') == row_1
    assert plate.rows('A', 1) == [row_1, row_2]


def test_column_accessor():
    return None




def test_list_labware():
    return None


def test_properties():
    return None


def test_inheritance_methods():
    return None
