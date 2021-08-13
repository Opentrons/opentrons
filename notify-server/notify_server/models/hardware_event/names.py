"""The hardware event names."""
from enum import Enum


class HardwareEventName(str, Enum):
    """The hardware event name enumeration."""

    BUTTON_STATE = "button_state"
