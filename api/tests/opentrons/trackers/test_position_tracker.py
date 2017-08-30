import pytest

from opentrons.trackers import position_tracker as pt
from opentrons.util import calibration_functions as cf
from opentrons.trackers import position_tracker
from opentrons import containers
from opentrons.instruments import Pipette
from opentrons.containers import load as containers_load
from opentrons.util import trace



@pytest.fixture
def robot():
    from opentrons import Robot
    return Robot()



def test_add_container_to_deck(robot):
    plate = containers_load(robot, '96-flat', 'A1')
    assert plate in robot.position_tracker


def test_calibrate_plate(robot):
    plate = containers_load(robot, '96-flat', 'A1')
    assert robot.position_tracker[plate]    == pt.Pose(10,10, 0)
    assert robot.position_tracker[plate[2]] == pt.Pose(24.8, 6.8, 10.5)
    assert robot.position_tracker[plate[5]] == pt.Pose(51.8, 6.8, 10.5)

    cf.calibrate_container_with_delta(plate, robot.position_tracker, 1, 3, 4)
    assert robot.position_tracker[plate] == pt.Pose(11, 13, 4)
    assert robot.position_tracker[plate[2]] == pt.Pose(25.8, 9.8, 14.5)
    assert robot.position_tracker[plate[5]] == pt.Pose(52.8, 9.8, 14.5)

def test_add_pipette(robot):
    p200 = Pipette(robot, 'a')
    assert p200 in robot.position_tracker

def test_pipette_movement(robot):
    p200  = Pipette(robot, 'a')
    plate = containers_load(robot, '96-flat', 'A1')
    p200.move_to(plate[2])
    assert robot.position_tracker[p200] == pt.Pose(24.8, 6.8, 10.5)


def test_max_z(robot):
    containers_load(robot, '96-flat', 'A1')
    deck = robot._deck
    assert robot.position_tracker.max_z_in_subtree(deck) == 10.5
    plate = containers_load(robot, 'small_vial_rack_16x45', 'B1')
    assert robot.position_tracker.max_z_in_subtree(deck) == 45
    robot.position_tracker.translate_object(plate, 0, 0, 1)
    assert robot.position_tracker.max_z_in_subtree(deck) == 46




