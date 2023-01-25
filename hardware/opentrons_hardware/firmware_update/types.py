"""Types for firmware updates."""
from enum import Enum, auto


class FirmwareUpdateStatus(Enum):
    """Firmware Update Status for each Node."""

    queued = auto()
    updating = auto()
    done = auto()
