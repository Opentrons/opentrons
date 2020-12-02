"""The definition of payload types."""
from typing import Union
from pydantic import BaseModel
from notify_server.models.sample_events import SampleOne, SampleTwo
from opentrons.hardware_control.types import DoorState


class DoorSwitchEventType(BaseModel):
    """Payload type of a Door switch update event."""

    # TODO (SPP,2020-12-02): Add more specific type bindings for pub/subs
    # so that there is type-level association between a topic and
    # its associated event(s).
    new_state: DoorState


PayloadType = Union[
    SampleOne,
    SampleTwo,
    DoorSwitchEventType,
]
