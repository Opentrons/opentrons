import pytest

from opentrons.data_storage import database
from opentrons.containers import load as containers_load
from opentrons.util.vector import Vector
from opentrons.util import calibration_functions as cf

# Could use some default container db which lives in the test file.
# Then, everytime the test is run, it creates a new db,
# copies the tester db over, runs on it, and then deletes it

@pytest.fixture
def robot():
    from opentrons import Robot
    return Robot()

#TODO: Use some non-persistent db instance in testing
@pytest.fixture
def db():
    pass

def test_container_from_container_load(robot):
    plate = containers_load(robot, '96-flat', 'A1')
    assert plate.get_type()                           == '96-flat'
    assert plate._coordinates                         == Vector(11.24, 14.34, 0.00)

def test_well_from_container_load(robot):
    plate = containers_load(robot, '96-flat', 'A1')
    assert plate[3].top()[1]                          == Vector(3.20, 3.20, 10.50)
    assert plate[3].properties                        == {'depth': 10.5, 'total-liquid-volume': 400, 'diameter': 6.4,
                                                          'height': 10.5, 'width': 6.4, 'length': 6.4}

def test_container_parse(robot):
    plate = containers_load(robot, '96-flat', 'A1')
    assert database._parse_container_obj(plate)       == Vector(11.24, 14.34, 0.00)

def test_well_parse(robot):
    plate = containers_load(robot, '96-flat', 'A1')
    assert database._parse_well_obj(plate[18])        == ('C3', 18.0, 18.0, 0.0, 10.5,
            400, 6.4, 6.4, 6.4)
    assert database._parse_well_obj(plate[45])        == ('F6', 45.0, 45.0, 0.0, 10.5,
            400, 6.4, 6.4, 6.4)

