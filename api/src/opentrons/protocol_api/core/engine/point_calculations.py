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


def are_overlapping_rectangles(
    rectangle1: Tuple[Point, Point],
    rectangle2: Tuple[Point, Point],
) -> bool:
    """Return whether the two provided rectangles are overlapping in 2D space.

    The rectangles are assumed to be coplanar and represented by tuples of
    the back-left and front right vertices (in that order) of the respective rectangles.
    The z-coordinate of each point will be ignored.

    We determine if the rectangles overlap by comparing projections of the sides of
    the rectangles on each of the 2 axes (x & y). If the projections on each axis overlap,
    then we can conclude that the rectangles overlap.

    The projection on an axis overlaps if the distance between the first projected point
    and the last projected point is less than the sum of the lengths of the projected sides
    of the two rectangles. For example, if we have two rectangles with vertices:
    Rect1 -> BL: (x1, y1), FR: (x2, y2)
    Rect2 -> BL: (x3, y3), FR: (x4, y4)

    Then for the two rectangles to be overlapping, they should satisfy:
    max(x1, x2, x3, x4) - min(x1, x2, x3, x4) < (x2 - x1) + (x4 - x3)
    AND
    max(y1, y2, y3, y4) - min(y1, y2, y3, y4) < (y2 - y1) + (y4 - y3)
    """
    x_coordinates = [rectangle1[0].x, rectangle1[1].x, rectangle2[0].x, rectangle2[1].x]
    x_length_rect1 = abs(rectangle1[1].x - rectangle1[0].x)
    x_length_rect2 = abs(rectangle2[1].x - rectangle2[0].x)
    overlapping_in_x = (
        abs(max(x_coordinates) - min(x_coordinates)) < x_length_rect1 + x_length_rect2
    )
    y_coordinates = [rectangle1[0].y, rectangle1[1].y, rectangle2[0].y, rectangle2[1].y]
    y_length_rect1 = abs(rectangle1[1].y - rectangle1[0].y)
    y_length_rect2 = abs(rectangle2[1].y - rectangle2[0].y)
    overlapping_in_y = (
        abs(max(y_coordinates) - min(y_coordinates)) < y_length_rect1 + y_length_rect2
    )
    return overlapping_in_x and overlapping_in_y
