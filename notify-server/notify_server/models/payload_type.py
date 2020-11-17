"""The definition of payload types."""
from typing import Union

from notify_server.models.sample_events import SampleTwo, DoorSwitchEvent


PayloadType = Union[
    SampleTwo,
    DoorSwitchEvent,
]
