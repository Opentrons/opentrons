from typing import Dict

import pytest

from opentrons.drivers.smoothie_drivers import SmoothieDriver
from opentrons.drivers.smoothie_drivers.constants import AXES
from opentrons.drivers.smoothie_drivers.constants import HOMED_POSITION as HP

POSITION_ON_BOOT = {axis: 0 for axis in AXES}


def test_driver_init(smoothie: SmoothieDriver) -> None:
    assert smoothie.position == POSITION_ON_BOOT


async def test_home(smoothie: SmoothieDriver) -> None:
    await smoothie.home()
    assert smoothie.position == HP


@pytest.mark.parametrize(
    "target_movement, expected_new_position",
    [
        (
            {"X": 1, "Y": 1, "Z": 1, "A": 1, "B": 1, "C": 1},
            {"X": 1, "Y": 1, "Z": 1, "A": 1, "B": 1, "C": 1},
        ),
        (
            {"X": 10, "Y": 21, "A": 1, "C": 1},
            {"X": 10, "Y": 21, "Z": HP.get("Z"), "A": 1, "B": HP.get("B"), "C": 1},
        ),
        (
            {"Z": 10, "B": 21, "C": 1},
            {
                "X": HP.get("X"),
                "Y": HP.get("Y"),
                "Z": 10,
                "A": HP.get("A"),
                "B": 21,
                "C": 1,
            },
        ),
    ],
)
async def test_move(
    target_movement: Dict[str, float],
    expected_new_position: Dict[str, float],
    smoothie: SmoothieDriver,
) -> None:
    await smoothie.home()
    await smoothie.move(target_movement)
    assert smoothie.position == expected_new_position
