import pytest
from opentrons.trackers.pose_tracker import (
    change_base, init, ROOT
)
from opentrons.instruments import Pipette
from opentrons.robot.mover import Mover
from numpy import array, isclose
from opentrons.drivers.smoothie_drivers.v3_0_0.driver_3_0 import SmoothieDriver_3_0_0  # NOQA


@pytest.fixture
def driver():
    return SmoothieDriver_3_0_0()


def test_functional(driver):
    scale = array([
        [2, 0, 0, -1],
        [0, 2, 0, -2],
        [0, 0, 2, -3],
        [0, 0, 0,  1],
    ])

    back = array([
        [0.5,   0,   0, 0],
        [0,   0.5,   0, 0],
        [0,     0, 0.5, 0],
        [0,     0,   0, 1],
    ])

    left = Mover(
        driver=driver,
        axis_mapping={'z': 'Z'},
        src=ROOT,
        dst=id(scale))
    right = Mover(
        driver=driver,
        axis_mapping={'z': 'A'},
        src=ROOT,
        dst=id(scale))
    gantry = Mover(
        driver=driver,
        axis_mapping={'x': 'X', 'y': 'Y'},
        src=ROOT,
        dst=id(scale),
    )

    state = init() \
        .add(id(scale), transform=scale) \
        .add(gantry, id(scale)) \
        .add(left, gantry) \
        .add(right, gantry) \
        .add('left', left, transform=back) \
        .add('right', right, transform=back)

    state = gantry.move(state, x=1, y=1)
    state = left.move(state, z=1)

    assert isclose(change_base(state, src='left'), (1, 1, 1)).all()
    assert isclose(change_base(state, src='right'), (1, 1, 1.5)).all()
    state = gantry.move(state, x=2, y=2)
    state = right.move(state, z=3)
    assert isclose(change_base(state, src='left'), (2, 2, 1)).all()
    assert isclose(change_base(state, src='right'), (2, 2, 3)).all()
    state = gantry.jog(state, axis='x', distance=1)
    assert isclose(change_base(state, src='left'), (3, 2, 1)).all()
    assert isclose(change_base(state, src='right'), (3, 2, 3)).all()
    state = right.jog(state, axis='z', distance=1)
    assert isclose(change_base(state, src='left'), (3, 2, 1)).all()
    assert isclose(change_base(state, src='right'), (3, 2, 4)).all()


def test_integration(robot):
    left = Pipette(robot, mount='left')
    robot.home()
    pose = left._move(robot.poses, 1, 1, 1)
    assert isclose(change_base(pose, src=left), (1, 1, 1)).all()
