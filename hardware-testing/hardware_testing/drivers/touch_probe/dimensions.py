"""Data and configuration ."""
from opentrons.types import Point
from typing import Optional
from dataclasses import dataclass

# ============================================================================
# Data
# ============================================================================


@dataclass
class ProbeTarget:
    """Global configuration of dimensions found."""

    deck_pos: Point
    x_min: Point
    x_max: Point
    y_min: Point
    y_max: Point
    z_max: Point  # top of object
    radius: Optional[float]

    @property
    def width(self) -> float:
        """Width of the probed area (X dimension)."""
        return abs(self.x_max.x - self.x_min.x)

    @property
    def length(self) -> float:
        """Length of the probed area (Y dimension)."""
        return abs(self.y_max.y - self.y_min.y)

    @property
    def height(self) -> float:
        """Height of the probed area (Z dimension from deck to top)."""
        return self.z_max.z - self.deck_pos.z


@dataclass
class LabwareDims(ProbeTarget):
    """Container for probe results with computed properties."""

    well_bottom: Optional[Point] = None
    num_wells: Optional[int] = 96
    x_offset: float = 0.0
    y_offset: float = 0.0
    spacing: float = 0.0

    def set_num_wells(self, num_wells: int) -> None:
        """Determines dimensions based on well number."""
        self.num_wells = num_wells
        match num_wells:
            case 96:
                self.x_offset = 14.38
                self.y_offset = 11.23
                self.spacing = 9.0
            case 384:
                self.x_offset = 11.3
                self.y_offset = 8.5
                self.spacing = 3.4
            case _:
                raise ValueError(f"Unsupported num_wells: {num_wells}")

    @property
    def depth(self) -> Optional[float]:
        """Return the vertical distance from the top to the bottom of the hole, or None if unknown."""
        if self.well_bottom is None:
            return None
        return self.z_max.z - self.well_bottom.z

    @property
    def bottom_offset(self) -> Optional[float]:
        """Height of the bottom offset (Z dimension from hole bottom to deck)."""
        if self.well_bottom is None:
            return None
        return self.well_bottom.z - self.deck_pos.z
