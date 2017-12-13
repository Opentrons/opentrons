import pytest
from opentrons.instruments.temp_plate import TemperaturePlate


GCODES = {'SET_TEMP': 'M104 S{temp}',
          'GET_TEMP': 'M105'}


@pytest.fixture
def plate(robot):
    gcode_buffer = []

    def buffer_gcodes(command, timeout=None):
        gcode_buffer.append(command)

    temp_plate = TemperaturePlate(robot, 'A1', min_temp=4, max_temp=70)
    setattr(temp_plate.driver, '_send_command', buffer_gcodes)
    setattr(temp_plate, 'test_buffer', gcode_buffer)
    temp_plate.driver.simulating = False
    return temp_plate


@pytest.fixture
def sim_plate(robot):
    temp_plate = TemperaturePlate(robot, 'A1', min_temp=4, max_temp=70)
    return temp_plate


@pytest.mark.parametrize("temp, gcode", (
        (temp, [GCODES['SET_TEMP'].format(temp=temp)])
        for temp in [10, 20, 50, 50.52, 70, 4]))
def test_set_temp_gcode(plate, temp, gcode):
    plate.set_temp(temp)
    assert plate.test_buffer == gcode


@pytest.mark.parametrize("temp", [-1, 1, 0, 100, 70.1, 3.9])
def test_set_invalid_temp(plate, temp):
    with pytest.raises(UserWarning):
        plate.set_temp(temp)
    assert plate.test_buffer == []


def test_shutdown(plate):
    plate.shutdown()
    # Firmware interprets setting the temp to 0 as a shutdown
    assert plate.test_buffer == [GCODES['SET_TEMP'].format(temp=0)]


@pytest.mark.parametrize("temp", [10, 20, 50, 50.52, 70, 4])
def test_set_temp_sim(sim_plate, temp):
    sim_plate.set_temp(temp)
    assert sim_plate.get_temp() == temp
