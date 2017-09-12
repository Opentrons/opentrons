import pytest

from opentrons.util import calibration_functions as cf
from opentrons.instruments import Pipette
from opentrons.containers import load as containers_load
from opentrons.util.vector import Vector
from opentrons.util.testing.fixtures import robot
from opentrons.util.testing.util import build_temp_db, approx


def test_add_container_to_deck(robot):
    plate = containers_load(robot, '96-flat', 'A1')
    assert plate in robot.position_tracker

def test_calibrate_plate(robot, tmpdir):
    build_temp_db(tmpdir)
    #Load container | Test positions of container and wells
    plate = containers_load(robot, '96-flat', 'A1')
    assert approx(robot.position_tracker[plate].position)           == 45
    assert approx(robot.position_tracker[plate].position)           == approx((21.24,24.34, 0.0))
    assert approx(robot.position_tracker[plate[2]].position)        == approx((39.24, 24.34, 10.5))
    assert approx(robot.position_tracker[plate[5]].position)        == approx((66.24, 24.34, 10.5))
    #Calibrate container with delta | Test is position was correctly adjusted
    cf.calibrate_container_with_delta(plate, robot.position_tracker, 1, 3, 4, True)
    assert approx(robot.position_tracker[plate].position)           == approx((22.24, 27.34, 4.0))
    assert approx(robot.position_tracker[plate[2]].position)        == approx((40.24, 27.34, 14.5))
    assert approx(robot.position_tracker[plate[5]].position)        == approx((67.24, 27.34, 14.5))


def test_add_pipette(robot, tmpdir):
    build_temp_db(tmpdir)

    p200 = Pipette(robot, 'a')
    assert p200 in robot.position_tracker


def test_pipette_movement(robot, tmpdir):
    build_temp_db(tmpdir)

    p200  = Pipette(robot, 'a')
    plate = containers_load(robot, '96-flat', 'A1')
    p200.move_to(plate[2])
    assert approx(robot.position_tracker[p200].position)            == approx((39.24, 24.34,10.5))


def test_max_z(robot, tmpdir):
    build_temp_db(tmpdir)

    containers_load(robot, '96-flat', 'A1')
    deck = robot._deck
    assert robot.position_tracker.max_z_in_subtree(deck)            == 10.5

    plate = containers_load(robot, 'small_vial_rack_16x45', 'B1')
    assert robot.position_tracker.max_z_in_subtree(deck)            == 45

    robot.position_tracker.translate_object(plate, 0, 0, 1)
    assert robot.position_tracker.max_z_in_subtree(deck)            == 46


def test_get_object_children(robot):
    plate = containers_load('96-flat', 'B2')
    children = robot.position_tracker.get_object_children(plate)
    children == plate.get_children_list()
