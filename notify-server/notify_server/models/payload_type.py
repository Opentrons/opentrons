"""The definition of payload types."""
from typing import Union

from notify_server.models.hardware_event import HardwareEventPayload
from notify_server.models.sample_events import SampleOne, SampleTwo


PayloadType = Union[
    SampleOne,
    SampleTwo,
    HardwareEventPayload,
]
