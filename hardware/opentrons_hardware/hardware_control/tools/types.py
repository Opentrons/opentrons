"""tool types."""
import enum


class Carrier(enum.Enum):
    """Carrier type to associate tool with."""

    LEFT = enum.auto()
    RIGHT = enum.auto()
