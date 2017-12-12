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
    return temp_plate


@pytest.mark.parametrize("temp, gcode", [
    (10, [GCODES['SET_TEMP'].format(temp=10)]),
    (20, [GCODES['SET_TEMP'].format(temp=20)]),
    (50, [GCODES['SET_TEMP'].format(temp=50)]),
    (50.52, [GCODES['SET_TEMP'].format(temp=50.52)]),
    (70, [GCODES['SET_TEMP'].format(temp=70)]),
    (4, [GCODES['SET_TEMP'].format(temp=4)])
])
def test_set_temp(plate, temp, gcode):
    plate.set_temp(temp)
    assert plate.get_temp() == temp
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
