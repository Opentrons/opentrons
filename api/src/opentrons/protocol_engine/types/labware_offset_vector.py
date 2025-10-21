"""Protocol engine types for labware offset vectors.

This is a separate module to avoid circular imports.
"""
from __future__ import annotations

from pydantic import BaseModel


# TODO(mm, 2022-11-07): Deduplicate with Vec3f.
class LabwareOffsetVector(BaseModel):
    """Offset, in deck coordinates from nominal to actual position."""

    x: float
    y: float
    z: float
