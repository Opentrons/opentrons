"""Protocol engine types for labware offset vectors.

This is a separate module to avoid circular imports.
"""
from __future__ import annotations
from typing import Any

from pydantic import BaseModel

from opentrons.types import Point


# TODO(mm, 2022-11-07): Deduplicate with Vec3f.
class LabwareOffsetVector(BaseModel):
    """Offset, in deck coordinates from nominal to actual position."""

    x: float
    y: float
    z: float

    def __add__(self, other: Any) -> LabwareOffsetVector:
        """Adds two vectors together."""
        if not isinstance(other, LabwareOffsetVector):
            return NotImplemented
        return LabwareOffsetVector(
            x=self.x + other.x, y=self.y + other.y, z=self.z + other.z
        )

    def __sub__(self, other: Any) -> LabwareOffsetVector:
        """Subtracts two vectors."""
        if not isinstance(other, LabwareOffsetVector):
            return NotImplemented
        return LabwareOffsetVector(
            x=self.x - other.x, y=self.y - other.y, z=self.z - other.z
        )

    def to_point(self) -> Point:
        """Convert the vector to a Point."""
        return Point(x=self.x, y=self.y, z=self.z)
