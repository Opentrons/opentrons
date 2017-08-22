import pytest

from opentrons.trackers import position_tracker as pt
from opentrons.trackers import calibration_functions
from opentrons.trackers import position_tracker
from opentrons import containers
from opentrons.instruments import Pipette



@pytest.fixture
def robot():
    from opentrons import Robot
    return Robot()



def test_add_container_to_deck(robot):
    plate = containers.load('96-flat', 'A1')
    assert plate in robot.position_tracker


def test_calibrate_plate(robot):
    plate = containers.load('96-flat', 'A1')
    assert position_tracker[plate]    == pt.Pose(10,10, 0)
    assert position_tracker[plate[2]] == pt.Pose(26.04, 11.14, 0)
    assert position_tracker[plate[5]] == pt.Pose(53.04, 11.14, 0)

    calibration_functions.calibrate_container(plate, [1, 3, 4])
    assert position_tracker[plate] == pt.Pose(11, 13, 4)
    assert position_tracker[plate[2]] == pt.Pose(27.04, 14.14, 4)
    assert position_tracker[plate[5]] == pt.Pose(54.04, 14.14, 4)

def test_add_pipette(robot):
    p200 = Pipette(robot, 'a')
    assert p200 in robot.position_tracker



