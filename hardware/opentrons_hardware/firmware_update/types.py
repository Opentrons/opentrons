"""Types for firmware updates."""
from enum import Enum, auto
from typing import Dict, Tuple
from opentrons_hardware.firmware_bindings import NodeId


class FirmwareUpdateStatus(Enum):
    """Firmware Update Status for each Node."""

    queued = auto()
    updating = auto()
    done = auto()


StatusElement = Tuple[FirmwareUpdateStatus, float]
StatusDict = Dict[NodeId, StatusElement]
