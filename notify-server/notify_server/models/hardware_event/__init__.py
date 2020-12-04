"""Definitions of hardware event payloads."""
from typing import Union

from .door_state import DoorStatePayload


HardwareEventPayload = Union[DoorStatePayload]
