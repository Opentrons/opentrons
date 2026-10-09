"""
hardware_control: The sole authority for controlling the hardware of an OT2.

The hardware_control module presents a unified api for the lowest level of
hardware command that takes into account the robot as a whole. For instance,
it presents an API for moving a specific pipette mount (not a specific motor
or axis)  to a deck-absolute point (not a Smoothie-coordinate point).

This module is not for use outside the opentrons api module. Higher-level
functions are available elsewhere.
"""

from typing import Union

# .types must be imported first to avoid circular import with opentrons.config.types
from .types import CriticalPoint, ExecutionState, OT3Mount  # isort: skip

from .adapters import SynchronousAdapter
from .constants import DROP_TIP_RELEASE_DISTANCE
from .execution_manager import ExecutionManager
from .instruments import AbstractInstrument, Gripper

# TODO (lc 12-05-2022) We should 1. figure out if we need
# to globally export a class that is strictly used in the hardware controller
# and 2. how to properly export an ot2 and ot3 pipette.
from .instruments.ot2.pipette import Pipette
from .ot3_calibration import OT3Transforms
from .pause_manager import PauseManager
from .protocols import FlexHardwareControlInterface
from .thread_manager import ThreadManager
from .threaded_async_lock import ThreadedAsyncForbidden, ThreadedAsyncLock
from opentrons.config.types import OT3Config
from opentrons.types import Mount

OT3HardwareControlAPI = FlexHardwareControlInterface[
    OT3Transforms, Union[Mount, OT3Mount], OT3Config
]
HardwareControlAPI = Union[OT3HardwareControlAPI]

ThreadManagedHardware = ThreadManager[HardwareControlAPI]
SyncHardwareAPI = SynchronousAdapter[HardwareControlAPI]

__all__ = [
    "AbstractInstrument",
    "Pipette",
    "Gripper",
    "PauseManager",
    "SynchronousAdapter",
    "HardwareControlAPI",
    "CriticalPoint",
    "DROP_TIP_RELEASE_DISTANCE",
    "ThreadManager",
    "ExecutionManager",
    "ExecutionState",
    "ThreadedAsyncLock",
    "ThreadedAsyncForbidden",
    "ThreadManagedHardware",
    "SyncHardwareAPI",
    "OT3HardwareControlAPI",
]
