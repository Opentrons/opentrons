"""Tests for Protocol API point calculation."""

from typing import Tuple

import pytest

from opentrons.protocol_api.core.engine import point_calculations as subject
from opentrons.types import Point


def test_get_relative_offset() -> None:
    """It should get a relative offset given a point, size in x, y, z, and x, y, z ratios."""
    result = subject.get_relative_offset(
        point=Point(1.0, 2.0, 3.0),
        size=(4, 8, 16),
        x_ratio=0.5,
        y_ratio=0.25,
        z_ratio=0.125,
    )

    assert result == Point(2.0, 3.0, 4.0)


@pytest.mark.parametrize(
    argnames=["rect1", "rect2", "expected_result"],
    argvalues=[
        (  # One rectangle inside the other
            (Point(236, 170, 0), Point(391, 375, 0)),
            (Point(237, 250, 0), Point(388, 294, 0)),
            True,
        ),
        (  # One rectangle inside the other
            (Point(237, 250, 0), Point(388, 294, 0)),
            (Point(236, 170, 0), Point(391, 375, 0)),
            True,
        ),
        (  # Two non-overlapping rectangles
            (Point(236, 170, 0), Point(391, 375, 0)),
            (Point(438, 216, 100), Point(937, 306, 200)),
            False,
        ),
        (  # Two non-overlapping rectangles in 2nd quadrant
            (Point(-438, 216, 100), Point(-937, 306, 200)),
            (Point(-236, 170, 0), Point(-391, 375, 0)),
            False,
        ),
        (  # Overlapping rectangles with one corner of each rectangle overlapping
            (Point(719, 304, 20), Point(970, 370, 20)),
            (Point(438, 216, 100), Point(937, 306, 200)),
            True,
        ),
        (  # Overlapping rectangles with no overlapping corners
            # (think two rectangles making a '+' sign)
            (Point(630, 94, 20), Point(800, 500, 20)),
            (Point(438, 216, 100), Point(937, 306, 200)),
            True,
        ),
    ],
)
def test_are_overlapping_rectangles(
    rect1: Tuple[Point, Point],
    rect2: Tuple[Point, Point],
    expected_result: bool,
) -> None:
    """It should calculate correctly whether the rectangles are overlapping."""
    assert (
        subject.are_overlapping_rectangles(rectangle1=rect1, rectangle2=rect2)
        == expected_result
    )
