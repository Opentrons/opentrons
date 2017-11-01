import pytest
import numpy as np

from opentrons.trackers.pose_tracker import Pose

@pytest.mark.parametrize("x, y, z", [
    (0, 0, 0),
    (-1, -10, 10),
    (90, 5, -20),
    (20, 200, 20),
    (-30, -50, -10)
])
def test_init(x, y, z):
    pose_matrix = np.array([[1.,  0.,  0.,  x],
                            [0.,  1.,  0.,  y],
                            [0.,  0.,  1.,  z],
                            [0.,  0.,  0.,  1.]])

    test_pose = Pose(x=x, y=y, z=z)
    check_pose = Pose(x=x, y=y, z=z)

    assert test_pose.x == x
    assert test_pose.y == y
    assert test_pose.z == z
    assert (test_pose.position == np.array([x, y, z])).all()
    assert (test_pose._pose == pose_matrix).all()
    assert test_pose == check_pose


@pytest.mark.parametrize("pose1, pose2, product", [
    (Pose(0, 0, 0), Pose(-1, -10, 10), Pose(-1, -10, 10)),
    (Pose(-1, -10, 10), Pose(0, 0, 0), Pose(-1, -10, 10)),
    (Pose(1, 2, 3), Pose(-1, -10, 10), Pose(0, -8, 13)),
    (Pose(90, 5, 20), Pose(20, -100, 0), Pose(110, -95, 20))
])
def test_mult(pose1, pose2, product):
    result = pose1 * pose2
    assert (result == product).all()

    double_check = pose1._pose.dot(pose2._pose)
    assert (double_check == product._pose).all()
