"""Definitions of hardware event payloads."""
from typing import Union

from .door_state import DoorStatePayload as DoorStatePayload


HardwareEventPayload = Union[DoorStatePayload]
