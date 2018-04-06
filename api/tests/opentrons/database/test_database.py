import pytest

from opentrons.containers import load as containers_load
from opentrons.data_storage import database
from opentrons.util.vector import Vector


def test_container_from_container_load(robot):
    plate = containers_load(robot, '96-flat', '1')
    assert plate.get_type() == '96-flat'
    h1, top = plate.well('H1').top()
    print("H1: {}".format(h1.coordinates()))
    print("Top: {}".format(top))
    target = tuple((round(l + v, 3) for l, v in zip(h1.coordinates(), top)))
    assert target == (14.34, 11.24, 10.50)


def test_well_from_container_load(robot):
    plate = containers_load(robot, '96-flat', '1')
    assert plate[3].top()[1] == Vector(3.20, 3.20, 10.50)
    assert plate[3].properties == {'depth': 10.5,
                                   'total-liquid-volume': 400,
                                   'diameter': 6.4,
                                   'height': 10.5,
                                   'width': 6.4,
                                   'length': 6.4}


def test_invalid_container_name():
    with pytest.raises(FileNotFoundError):
        database.load_container("fake_container")
