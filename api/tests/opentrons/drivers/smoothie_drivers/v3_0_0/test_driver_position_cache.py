import pytest

from opentrons.drivers.smoothie_drivers.driver_3_0 import (
    AXES, HOMED_POSITION
)

POSITION_ON_BOOT = {axis: 0 for axis in AXES}


def test_driver_init(smoothie):
    assert smoothie.position == POSITION_ON_BOOT


def test_home(smoothie):
    smoothie.home()
    assert smoothie.position == HOMED_POSITION


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
def test_move(target_movement, expected_new_position, smoothie):
    smoothie.home()
    smoothie.move(target_movement)
    assert smoothie.position == expected_new_position
