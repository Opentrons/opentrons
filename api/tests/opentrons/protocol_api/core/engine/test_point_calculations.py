"""Tests for Protocol API point calculation."""
from opentrons.types import Point

from opentrons.protocol_api.core.engine import point_calculations as subject


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
