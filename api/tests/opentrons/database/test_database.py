import pytest

from opentrons.containers import load as containers_load
from opentrons.containers.placeable import Well, Container
from opentrons.data_storage import database
from opentrons.util.vector import Vector
from opentrons import robot
from opentrons.config import feature_flags as ff


def test_container_from_container_load():
    robot.reset()
    plate = containers_load(robot, '96-flat', '1')
    if ff.split_labware_definitions():
        actual = plate[0]._coordinates + plate[0].top()[1]
        expected = Vector(14.34, 74.24, 10.50)
    else:
        actual = plate._coordinates
        expected = Vector(14.34, 11.24, 10.50)
    assert plate.get_type() == '96-flat'
    assert actual == expected


def test_well_from_container_load():
    robot.reset()
    plate = containers_load(robot, '96-flat', '1')
    assert plate[3].top()[1] == Vector(3.20, 3.20, 10.50)
    assert plate[3].properties == {'depth': 10.5,
                                   'total-liquid-volume': 400,
                                   'diameter': 6.4,
                                   'height': 10.5,
                                   'width': 6.4,
                                   'length': 6.4}


def test_container_parse():
    robot.reset()
    plate = containers_load(robot, '96-flat', '1')
    if ff.split_labware_definitions():
        expected = {'x': 0, 'y': 0, 'z': 0}
    else:
        expected = {'x': 14.34, 'y': 11.24, 'z': 10.50}
    assert database._parse_container_obj(plate) == expected


def test_load_persisted_container():
    plate = database.load_container("24-vial-rack")
    assert isinstance(plate, Container)
    assert isinstance(plate, Container)
    assert all([isinstance(w, Well) for w in plate])

    assert plate[0].coordinates() == (8.19, 63.76, 0)
    assert plate['A2'].coordinates() == (27.49, 63.76, 0)


def test_invalid_container_name():
    if ff.split_labware_definitions():
        error_type = FileNotFoundError
    else:
        error_type = ValueError
    with pytest.raises(error_type):
        database.load_container("fake_container")
