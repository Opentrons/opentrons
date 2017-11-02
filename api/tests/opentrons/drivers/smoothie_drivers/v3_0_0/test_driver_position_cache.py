import pytest

from opentrons.drivers.smoothie_drivers.v3_0_0.driver_3_0 import (
    AXES, HOMED_POSITION, SmoothieDriver_3_0_0
)

POSITION_ON_BOOT = {axis: 0 for axis in AXES}


@pytest.fixture
def driver():
    return SmoothieDriver_3_0_0()


@pytest.fixture
def homed_driver():
    driver = SmoothieDriver_3_0_0()
    driver.home()
    return driver


def test_driver_init(driver):
    assert driver.position == POSITION_ON_BOOT


def test_home(driver):
    driver.home()
    assert driver.position == HOMED_POSITION


@pytest.mark.parametrize("target_movement, expected_new_position", [
    (
        {'X': 1, 'Y': 1, 'Z': 1, 'A': 1, 'B': 1, 'C': 1},
        {'X': 1, 'Y': 1, 'Z': 1, 'A': 1, 'B': 1, 'C': 1}
    ),
    (
        {'X': 10, 'Y': 21, 'A': 1, 'C': 1},
        {'X': 10, 'Y': 21, 'Z': 227, 'A': 1, 'B': 18.9997, 'C': 1}
    ),
    (
        {'Z': 10, 'B': 21, 'C': 1},
        {'X': 394, 'Y': 344, 'Z': 10, 'A': 227, 'B': 21, 'C': 1}
    )
])
def test_move(target_movement, expected_new_position, homed_driver):
    homed_driver.move(target_movement)
    assert homed_driver.position == expected_new_position
