from typing import Tuple

from opentrons.types import Point


def get_relative_offset(
    point: Point,
    size: Tuple[float, float, float],
    x_ratio: float,
    y_ratio: float,
    z_ratio: float,
) -> Point:
    """Gets a relative offset for a deck coordinate based on percentage of the radius of each axis."""
    x_size, y_size, z_size = size

    x_offset = x_size / 2.0 * x_ratio
    y_offset = y_size / 2.0 * y_ratio
    z_offset = z_size / 2.0 * z_ratio

    return Point(
        x=point.x + x_offset,
        y=point.y + y_offset,
        z=point.z + z_offset,
    )
