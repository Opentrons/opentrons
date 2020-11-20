"""The definition of payload types."""
from typing import Union
from pydantic import BaseModel
from notify_server.models.sample_events import SampleOne, SampleTwo
from opentrons.hardware_control.types import DoorState


class DoorSwitchEventType(BaseModel):
    """Payload type of a Door switch update event."""

    new_state: DoorState


PayloadType = Union[
    SampleOne,
    SampleTwo,
    DoorSwitchEventType,
]
