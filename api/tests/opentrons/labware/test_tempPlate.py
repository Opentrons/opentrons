import pytest
from opentrons.instruments.temperaturePlate import TemperaturePlate

@pytest.fixture
def plate(robot):
    return TemperaturePlate(robot, 'A1')

def test_set_temp(plate):
    plate.set_temp(20)
    assert plate.get_temp() == 20


def test_set_temp_wait(plate):
    plate.set_temp(20, wait=True)
    assert plate.get_temp() == 20



