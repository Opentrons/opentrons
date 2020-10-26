"""The definition of payload types."""
from typing import Union

from notify_server.models.sample_events import SampleTwo, SampleOne


PayloadType = Union[
    SampleOne,
    SampleTwo,
]
