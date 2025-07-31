import pytest

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


def test_invalid_input() -> None:
    """It should raise if any axis's coordinates are backwards."""
    with pytest.raises(ValueError):
        AxisAlignedBoundingBox3D(min_x=1, max_x=-1, min_y=0, max_y=0, min_z=0, max_z=0)

    with pytest.raises(ValueError):
        AxisAlignedBoundingBox3D(min_x=0, max_x=0, min_y=1, max_y=-1, min_z=0, max_z=0)

    with pytest.raises(ValueError):
        AxisAlignedBoundingBox3D(min_x=0, max_x=0, min_y=0, max_y=0, min_z=1, max_z=-1)


def test_zero_input() -> None:
    """It should allow a zero-sized bounding box."""
    # Should not raise.
    AxisAlignedBoundingBox3D(min_x=0, max_x=0, min_y=0, max_y=0, min_z=0, max_z=0)
    # Should not raise.
    AxisAlignedBoundingBox3D.from_corners(Point(), Point())
