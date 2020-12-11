"""Model the door state event."""
from opentrons.hardware_control.types import DoorState
from typing_extensions import Literal

from pydantic import BaseModel

from notify_server.models.hardware_event.names import HardwareEventName


class DoorStatePayload(BaseModel):
    """The payload in a "door_state" event."""

    event: Literal[HardwareEventName.DOOR_STATE] = HardwareEventName.DOOR_STATE
    state: DoorState
