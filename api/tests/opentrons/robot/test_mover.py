import pytest
from opentrons.trackers.pose_tracker import (
    bind, add, Point, absolute, stringify, relative
)
from opentrons.instruments import Pipette
from opentrons.robot.gantry import Mover
from collections import namedtuple
from numpy import array, isclose
from numpy.linalg import inv


@pytest.fixture
def driver():
    class Driver:
        def move(self, target):
            pass

        def home(self, axis):
            pass

    return Driver()


def test_functional(driver):
    left = Mover(driver, axis_mapping={'z': 'Z'})
    right = Mover(driver, axis_mapping={'z': 'A'})
    gantry = Mover(
        driver,
        axis_mapping={'x': 'X', 'y': 'Y'},
        children=[left, right]
    )

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

    state = add({}, 'world') \
        .add(driver, 'world', transform=scale) \
        .add(gantry, driver) \
        .add(left, gantry) \
        .add(right, gantry) \
        .add('left', left, transform=back) \
        .add('right', right, transform=back)

    state = left.move(state, 1, 1, 1)

    assert isclose(absolute(state, 'left'), (1, 1, 1)).all()
    assert isclose(absolute(state, 'right'), (1, 1, 1.5)).all()
    state = right.move(state, 2, 2, 3)
    assert isclose(absolute(state, 'left'), (2, 2, 1)).all()
    assert isclose(absolute(state, 'right'), (2, 2, 3)).all()
    state = right.jog(state, axis='x', distance=1)
    assert isclose(absolute(state, 'left'), (3, 2, 1)).all()
    assert isclose(absolute(state, 'right'), (3, 2, 3)).all()
    state = right.jog(state, axis='z', distance=1)
    assert isclose(absolute(state, 'left'), (3, 2, 1)).all()
    assert isclose(absolute(state, 'right'), (3, 2, 4)).all()


def test_integration(robot):
    left = Pipette(robot, mount='left')
    right = Pipette(robot, mount='right')
    robot.home()
    pose = left._move(robot.poses, 1, 1, 1)
    assert isclose(absolute(pose, left), (1, 1, 1)).all()
