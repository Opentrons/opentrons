"""The definition of payload types."""
from typing import Union

from notify_server.models.hardware_event import HardwareEventPayload
from notify_server.models.protocol_event import ProtocolStepEvent
from notify_server.models.sample_events import SampleOne, SampleTwo


# TODO (SPP, 2020-12-4): Remove sample events once there are > 1 real events
PayloadType = Union[
    SampleOne,
    SampleTwo,
    HardwareEventPayload,
    ProtocolStepEvent
]
