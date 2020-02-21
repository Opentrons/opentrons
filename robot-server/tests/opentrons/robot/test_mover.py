import pytest
from numpy import array, isclose

from opentrons.legacy_api.instruments import Pipette
from opentrons.legacy_api.robot.mover import Mover
from opentrons.trackers.pose_tracker import (
    change_base, init, ROOT
)
# TODO: revamp test for readability and general test criteria when refactoring
# TODO: the pose_tracker


@pytest.mark.api1_only
def test_functional(smoothie):
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
        driver=smoothie,
        axis_mapping={'z': 'Z'},
        src=ROOT,
        dst=id(scale))
    right = Mover(
        driver=smoothie,
        axis_mapping={'z': 'A'},
        src=ROOT,
        dst=id(scale))
    gantry = Mover(
        driver=smoothie,
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


@pytest.mark.api1_only
def test_integration(robot):
    left = Pipette(robot, mount='left', ul_per_mm=1000, max_volume=1000)
    robot.home()
    pose = left._move(robot.poses, 1, 1, 1)
    assert isclose(change_base(pose, src=left), (1, 1, 1)).all()
