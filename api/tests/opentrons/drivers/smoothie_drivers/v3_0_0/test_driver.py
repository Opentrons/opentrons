import pytest

from opentrons.drivers.smoothie_drivers.v3_0_0 import driver_3_0

AXES = 'xyzabc'

POSITION_ON_BOOT = {axis: 0 for axis in AXES.lower()}

HOMED_POSITION = homed_positions = {
    'x': 394, 'y': 344, 'z': 227, 'a': 227, 'b': 18.9997, 'c': 18.9997
}

@pytest.fixture
def driver():
    return driver_3_0.SmoothieDriver_3_0_0()

@pytest.fixture
def homed_driver():
    driver = driver_3_0.SmoothieDriver_3_0_0()
    driver.home()
    return driver


def test_driver_init(driver):
    assert driver.position == POSITION_ON_BOOT

def test_home(driver):
    driver.home()
    assert driver.position == HOMED_POSITION

@pytest.mark.parametrize("movement, expected_position", [
    (
        {'x': 1, 'y': 1, 'z': 1, 'a': 1, 'b': 1, 'c': 1},  # position to move to
        {'x': 1, 'y': 1, 'z': 1, 'a': 1, 'b': 1, 'c': 1}   # expected new position
    ),
    (
        {'x': 10, 'y': 21, 'a': 1, 'c': 1},
        {'x': 10, 'y': 21, 'z': 227, 'a': 1, 'b':18.9997, 'c': 1}
    ),
    (
        {'z': 10, 'b': 21, 'c': 1},
        {'x':394, 'y': 344, 'z': 10, 'a':227, 'b': 21, 'c': 1},
    )
])
def test_move(movement, expected_position, homed_driver):
    homed_driver.move(**movement)
    assert homed_driver.position == expected_position
