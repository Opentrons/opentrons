from opentrons import labware2

test_data = {
    'circular_well_json': {
        'shape': 'circular',
        'depth': 40,
        'totalLiquidVolume': 100,
        'diameter': 30,
        'x': 10,
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
    well1 = labware2.Well(test_data['circular_well_json'])
    assert well1._diameter == test_data['circular_well_json']['diameter']
    assert well1._length is None
    assert well1._width is None

    well2 = labware2.Well(test_data['rectangular_well_json'])
    assert well2._diameter is None
    assert well2._length == test_data['rectangular_well_json']['length']
    assert well2._width == test_data['rectangular_well_json']['width']


def test_top():
    well = labware2.Well(test_data['circular_well_json'])
    well_data = test_data['circular_well_json']
    expected_x = well_data['x']
    expected_y = well_data['y']
    expected_z = well_data['z'] + well_data['depth']
    assert well.top() == (expected_x, expected_y, expected_z)


def test_bottom():
    well = labware2.Well(test_data['rectangular_well_json'])
    well_data = test_data['rectangular_well_json']
    expected_x = well_data['x']
    expected_y = well_data['y']
    expected_z = well_data['z']
    assert well.bottom() == (expected_x, expected_y, expected_z)
