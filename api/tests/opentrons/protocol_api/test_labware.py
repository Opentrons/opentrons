import json
import pkgutil
from opentrons.protocol_api import labware
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
        'length': 50,
        'width': 120,
        'x': 45,
        'y': 10,
        'z': 22
    }
}


def test_well_init():
    slot = Location(Point(1, 2, 3), 1)
    well_name = 'circular_well_json'
    well1 = labware.Well(test_data[well_name], slot, well_name)
    assert well1._diameter == test_data[well_name]['diameter']
    assert well1._length is None
    assert well1._width is None

    well2_name = 'rectangular_well_json'
    well2 = labware.Well(test_data[well2_name], slot, well2_name)
    assert well2._diameter is None
    assert well2._length == test_data[well2_name]['length']
    assert well2._width == test_data[well2_name]['width']


def test_top():
    slot = Location(Point(4, 5, 6), 1)
    well_name = 'circular_well_json'
    well = labware.Well(test_data[well_name], slot, well_name)
    well_data = test_data[well_name]
    expected_x = well_data['x'] + slot.point.x
    expected_y = well_data['y'] + slot.point.y
    expected_z = well_data['z'] + well_data['depth'] + slot.point.z
    assert well.top() == Location(Point(expected_x, expected_y, expected_z),
                                  well)


def test_bottom():
    slot = Location(Point(7, 8, 9), 1)
    well_name = 'rectangular_well_json'
    well = labware.Well(test_data[well_name], slot, well_name)
    well_data = test_data[well_name]
    expected_x = well_data['x'] + slot.point.x
    expected_y = well_data['y'] + slot.point.y
    expected_z = well_data['z'] + slot.point.z
    assert well.bottom() == Location(Point(expected_x, expected_y, expected_z),
                                     well)


def test_from_center_cartesian():
    slot1 = Location(Point(10, 11, 12), 1)
    well_name = 'circular_well_json'
    well1 = labware.Well(test_data[well_name], slot1, well_name)

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
    well2 = labware.Well(test_data[well2_name], slot2, well2_name)
    percent2_x = -0.25
    percent2_y = 0.1
    percent2_z = 0.9
    point2 = well2._from_center_cartesian(percent2_x, percent2_y, percent2_z)

    # slot.x + well.x - 0.25 * well.width/2
    expected_x = 13 + 45 - 15
    # slot.y + well.y + 0.1 * well.length/2
    expected_y = 14 + 10 + 2.5
    # slot.z + well.z + (1 + 0.9) * well.depth/2
    expected_z = 15 + 22 + 19

    assert point2.x == expected_x
    assert point2.y == expected_y
    assert point2.z == expected_z


def test_backcompat():
    labware_name = 'generic_96_wellPlate_380_uL'
    labware_def = json.loads(
        pkgutil.get_data('opentrons',
                         'shared_data/definitions2/{}.json'.format(
                             labware_name)))
    lw = labware.Labware(labware_def, Point(0, 0, 0), 'Test Slot')

    # Note that this test uses the display name of wells to test for equality,
    # because dimensional parameters could be subject to modification through
    # calibration, whereas here we are testing for "identity" in a way that is
    # related to the combination of well name, labware name, and slot name
    well_a1_name = repr(lw.wells_by_index()['A1'])
    well_b2_name = repr(lw.wells_by_index()['B2'])
    well_c3_name = repr(lw.wells_by_index()['C3'])

    w0 = lw[0]
    assert repr(w0) == well_a1_name

    w1 = lw['A1']
    assert repr(w1) == well_a1_name

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

    w9 = lw.cols('2')
    assert len(w9) == 1
    assert len(w9[0]) == len(labware_def['ordering'][1])
    assert repr(w9[0][1]) == well_b2_name

    w10 = lw.cols('2', '5')
    assert len(w10) == 2
    assert repr(w10[0][1]) == well_b2_name

    w11 = lw.columns('2', '3', '6')
    assert len(w11) == 3
    assert repr(w11[1][2]) == well_c3_name


def test_well_parent():
    labware_name = 'generic_96_wellPlate_380_uL'
    labware_def = json.loads(
        pkgutil.get_data('opentrons',
                         'shared_data/definitions2/{}.json'.format(
                             labware_name)))
    lw = labware.Labware(labware_def, Point(0, 0, 0), 'Test Slot')
    parent = Location(Point(7, 8, 9), lw)
    well_name = 'circular_well_json'
    well = labware.Well(test_data[well_name],
                        parent,
                        well_name)
    assert well.parent is lw
    assert well.top().labware is well
    assert well.top().labware.parent is lw
    assert well.bottom().labware is well
    assert well.bottom().labware.parent is lw
    assert well.center().labware is well
    assert well.center().labware.parent is lw
