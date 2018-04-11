import pytest

from opentrons.containers import load as containers_load
from opentrons.containers.placeable import Well, Container
from opentrons.data_storage import database
from opentrons.util.vector import Vector
from opentrons import robot


def test_container_from_container_load():
    robot.reset()
    plate = containers_load(robot, '96-flat', '1')
    assert plate.get_type() == '96-flat'
    assert plate._coordinates == Vector(14.34, 11.24, 10.50)


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
    assert database._parse_container_obj(plate) == {
        'x': 14.34,
        'y': 11.24,
        'z': 10.50
    }


def test_load_persisted_container():
    plate = database.load_container("24-vial-rack")
    assert isinstance(plate, Container)
    assert isinstance(plate, Container)
    assert all([isinstance(w, Well) for w in plate])

    assert plate[0].coordinates() == (8.19, 63.76, 0)
    assert plate[1].coordinates() == (27.49, 63.76, 0)


def test_invalid_container_name():
    with pytest.raises(ValueError):
        database.load_container("fake_container")


def test_invalid_container_name_new(split_labware_def):
    with pytest.raises(FileNotFoundError):
        database.load_labware('fake_container')
