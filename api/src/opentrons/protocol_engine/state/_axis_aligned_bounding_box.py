import dataclasses

from typing_extensions import Self

from opentrons.types import Point


@dataclasses.dataclass(kw_only=True)
class AxisAlignedBoundingBox3D:
    """An axis-aligned bounding box (in other words, a cuboid in 3D space)."""

    min_x: float
    max_x: float

    min_y: float
    max_y: float

    min_z: float
    max_z: float

    @classmethod
    def from_corners(cls, corner_a: Point, corner_b: Point) -> Self:
        """Construct from two diagonally opposite corners.

        It doesn't matter which two corners, as long as they're diagonally opposite.
        It also doesn't matter what order.
        """
        return cls(
            min_x=min(corner_a.x, corner_b.x),
            max_x=max(corner_a.x, corner_b.x),
            min_y=min(corner_a.y, corner_b.y),
            max_y=max(corner_a.y, corner_b.y),
            min_z=min(corner_a.z, corner_b.z),
            max_z=max(corner_a.z, corner_b.z),
        )

    @property
    def x_dimension(self) -> float:
        """Return the dimension along the x-axis."""
        return self.max_x - self.min_x

    @property
    def y_dimension(self) -> float:
        """Return the dimension along the y-axis."""
        return self.max_y - self.min_y

    @property
    def z_dimension(self) -> float:
        """Return the dimension along the z-axis."""
        return self.max_z - self.min_z
