import pytest

from opentrons.util import calibration_functions as cf
from opentrons.instruments import Pipette
from opentrons.containers import load as containers_load
from opentrons.util.vector import Vector
from opentrons.data_storage import database

@pytest.fixture
def robot():
    from opentrons import Robot
    return Robot()

def test_add_container_to_deck(robot):
    plate = containers_load(robot, '96-flat', 'A1')
    assert plate in robot.position_tracker

def test_calibrate_plate(robot):
    plate = containers_load(robot, '96-flat', 'A1')
    assert int(sum(robot.position_tracker[plate].position))         == 45
    assert int(sum(robot.position_tracker[plate].position))         == int(sum((21.24,24.34, 0.0)))
    assert int(sum(robot.position_tracker[plate[2]].position))      == int(sum((39.24, 24.34, 10.5)))
    assert int(sum(robot.position_tracker[plate[5]].position))      == int(sum((66.24, 24.34, 10.5)))

    cf.calibrate_container_with_delta(plate, robot.position_tracker, 1, 3, 4)
    assert int(sum(robot.position_tracker[plate].position))         == int(sum((22.24, 27.34, 4.0)))
    assert int(sum(robot.position_tracker[plate[2]].position))      == int(sum((40.24, 27.34, 14.5)))
    assert int(sum(robot.position_tracker[plate[5]].position))      == int(sum((67.24, 27.34, 14.5)))



def test_add_pipette(robot):
    p200 = Pipette(robot, 'a')
    assert p200 in robot.position_tracker



def test_pipette_movement(robot):
    p200  = Pipette(robot, 'a')
    plate = containers_load(robot, '96-flat', 'A1')
    p200.move_to(plate[2])
    assert int(sum(robot.position_tracker[p200].position))          == int(sum((39.24, 24.34,
        10.5)))



def test_max_z(robot):
    containers_load(robot, '96-flat', 'A1')
    deck = robot._deck
    assert robot.position_tracker.max_z_in_subtree(deck)            == 10.5

    plate = containers_load(robot, 'small_vial_rack_16x45', 'B1')
    assert robot.position_tracker.max_z_in_subtree(deck)            == 45

    robot.position_tracker.translate_object(plate, 0, 0, 1)
    assert robot.position_tracker.max_z_in_subtree(deck)            == 46



def test_database_load_and_conversion(robot):
    plate = containers_load(robot, '96-flat', 'A1')
    assert plate.get_type()                                         == '96-flat'
    assert plate._coordinates                                       == Vector(11.24, 14.34, 0.00)
    assert database._parse_container_obj(plate)                     == Vector(11.24, 14.34, 0.00)
    assert database._parse_well_obj(plate[18])                      == ('C3', 18.0, 18.0, 0.0, 10.5,
            400, 6.4, 6.4, 6.4)
    assert database._parse_well_obj(plate[45])                      == ('F6', 45.0, 45.0, 0.0, 10.5,
            400, 6.4, 6.4, 6.4)



