"""tool types."""
import enum


class Carrier(enum.Enum):
    """Carrier type to associate tool with."""

    A_CARRIER = enum.auto()
    Z_CARRIER = enum.auto()
    GRIPPER_CARRIER = enum.auto()
