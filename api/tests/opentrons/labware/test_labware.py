from opentrons import labware2

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
    slot = labware2.Point(1, 2, 3)
    well1 = labware2.Well(test_data['circular_well_json'], slot)
    assert well1._diameter == test_data['circular_well_json']['diameter']
    assert well1._length is None
    assert well1._width is None

    well2 = labware2.Well(test_data['rectangular_well_json'], slot)
    assert well2._diameter is None
    assert well2._length == test_data['rectangular_well_json']['length']
    assert well2._width == test_data['rectangular_well_json']['width']


def test_top():
    slot = labware2.Point(4, 5, 6)
    well = labware2.Well(test_data['circular_well_json'], slot)
    well_data = test_data['circular_well_json']
    expected_x = well_data['x'] + slot.x
    expected_y = well_data['y'] + slot.y
    expected_z = well_data['z'] + well_data['depth'] + slot.z
    assert well.top() == (expected_x, expected_y, expected_z)


def test_bottom():
    slot = labware2.Point(7, 8, 9)
    well = labware2.Well(test_data['rectangular_well_json'], slot)
    well_data = test_data['rectangular_well_json']
    expected_x = well_data['x'] + slot.x
    expected_y = well_data['y'] + slot.y
    expected_z = well_data['z'] + slot.z
    assert well.bottom() == (expected_x, expected_y, expected_z)


def test_from_center_cartesian():
    slot1 = labware2.Point(10, 11, 12)
    well1 = labware2.Well(test_data['circular_well_json'], slot1)

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

    slot2 = labware2.Point(13, 14, 15)
    well2 = labware2.Well(test_data['rectangular_well_json'], slot2)
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
