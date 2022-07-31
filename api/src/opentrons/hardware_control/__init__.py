"""
hardware_control: The sole authority for controlling the hardware of an OT2.

The hardware_control module presents a unified api for the lowest level of
hardware command that takes into account the robot as a whole. For instance,
it presents an API for moving a specific pipette mount (not a specific motor
or axis)  to a deck-absolute point (not a Smoothie-coordinate point).

This module is not for use outside the opentrons api module. Higher-level
functions are available elsewhere.
"""

from .adapters import SynchronousAdapter
from .api import API
from .pause_manager import PauseManager
from .backends import Controller, Simulator
from .types import (
    CriticalPoint,
    NoTipAttachedError,
    TipAttachedError,
    ExecutionState,
    ExecutionCancelledError,
)
from .constants import DROP_TIP_RELEASE_DISTANCE
from .thread_manager import ThreadManager
from .execution_manager import ExecutionManager
from .threaded_async_lock import ThreadedAsyncLock, ThreadedAsyncForbidden
from .protocols import HardwareControlAPI
from .instruments import AbstractInstrument, Pipette, Gripper

ThreadManagedHardware = ThreadManager[HardwareControlAPI]
SyncHardwareAPI = SynchronousAdapter[HardwareControlAPI]

__all__ = [
    "API",
    "AbstractInstrument",
    "Controller",
    "Simulator",
    "Pipette",
    "Gripper",
    "PauseManager",
    "SynchronousAdapter",
    "HardwareControlAPI",
    "CriticalPoint",
    "NoTipAttachedError",
    "TipAttachedError",
    "DROP_TIP_RELEASE_DISTANCE",
    "ThreadManager",
    "ExecutionManager",
    "ExecutionState",
    "ExecutionCancelledError",
    "ThreadedAsyncLock",
    "ThreadedAsyncForbidden",
    "ThreadManagedHardware",
    "SyncHardwareAPI",
]
