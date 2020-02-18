import pytest

from opentrons.trackers.pose_tracker import Point, translate


@pytest.mark.parametrize("pose1, pose2, product", [
    (Point(0, 0, 0), Point(-1, -10, 10), Point(-1, -10, 10)),
    (Point(-1, -10, 10), Point(0, 0, 0), Point(-1, -10, 10)),
    (Point(1, 2, 3), Point(-1, -10, 10), Point(0, -8, 13)),
    (Point(90, 5, 20), Point(20, -100, 0), Point(110, -95, 20))
])
def test_mult(pose1, pose2, product):
    result = translate(pose1).dot(translate(pose2))
    assert (result == translate(product)).all()
