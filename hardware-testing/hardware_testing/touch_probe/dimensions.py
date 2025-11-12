"""Data and configuration ."""
from hardware_testing.opentrons_api.types import Point
from typing import Optional
from dataclasses import dataclass

# ============================================================================
# Configuration
# ============================================================================


@dataclass
class ProbeConfig:
    """Global configuration for touch probe operations."""

    safe_z: float = 150.0
    probe_speed: float = 5.0
    edge_offset: float = 6.0  # how far inside the SLOT we start
    bound_offset: float = 5.0  # mm from edge of slot to consider as deck boundary
    xy_debounce_offset: float = 3.0  # mm to back off in X or Y
    shank_height: float = 22.0
    ball_radius: float = 0.75


# ============================================================================
# Data
# ============================================================================


@dataclass
class ProbeTarget:
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

    def set_num_wells(self, num_wells: int):
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
