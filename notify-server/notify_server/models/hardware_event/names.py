"""The hardware event names."""
from enum import Enum


class HardwareEventName(str, Enum):
    """The hardware event name enumeration."""

    DOOR_STATE = "door_state"
