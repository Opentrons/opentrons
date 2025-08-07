# noqa: D100

from opentrons.protocol_engine.state._axis_aligned_bounding_box import (
    AxisAlignedBoundingBox3D,
)
from opentrons.types import Point


def test_from_corners() -> None:
    """Test the `from_corners()` constructor."""
    result = AxisAlignedBoundingBox3D.from_corners(Point(1, -2, 3), Point(4, -5, 6))
    assert result.min_x == 1
    assert result.max_x == 4
    assert result.min_y == -5
    assert result.max_y == -2
    assert result.min_z == 3
    assert result.max_z == 6


def test_dimensions() -> None:
    """Test the dimension properties."""
    result = AxisAlignedBoundingBox3D.from_corners(Point(1, -2, 3), Point(9, -8, 7))
    assert result.x_dimension == 8
    assert result.y_dimension == 6
    assert result.z_dimension == 4
