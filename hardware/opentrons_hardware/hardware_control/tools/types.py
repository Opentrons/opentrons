"""tool types."""
import enum

# TODO(mc, 2020-10-22): use MountType implementation for Mount


class Mount(enum.Enum):
    """Mount type to associate tool with."""

    LEFT = enum.auto()
    RIGHT = enum.auto()
