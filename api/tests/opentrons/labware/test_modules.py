from opentrons.containers import load as containers_load
from opentrons.instruments.temperaturePlate import TemperaturePlate


def test_tempPlate_added(robot):
    temp_plate = TemperaturePlate(robot, 'A4')
    assert temp_plate in robot.get_containers()

def test_container_added(robot):
    temp_plate = TemperaturePlate(robot, 'A4')
    well_plate1 = containers_load(robot, '96-flat', 'B4')
    well_plate2 = containers_load(robot, '96-flat', temp_plate)
    assert well_plate1 in robot.get_containers()
    assert well_plate2 in robot.get_containers()

def test_module_in_posetracker(robot):
    temp_plate = TemperaturePlate(robot, 'A4')
    well_plate = containers_load(robot, '96-flat', temp_plate)
    assert temp_plate in robot.poses
    assert well_plate in robot.poses























































































