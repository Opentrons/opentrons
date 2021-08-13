"""Model the door state event."""
from opentrons.hardware_control.types import DoorState, ButtonState
from typing_extensions import Literal

from pydantic import BaseModel

from notify_server.models.hardware_event.names import HardwareEventName


class DoorStatePayload(BaseModel):
    """The payload in a "door_state" event."""

    event: Literal[HardwareEventName.BUTTON_STATE] = HardwareEventName.BUTTON_STATE
    state: ButtonState
