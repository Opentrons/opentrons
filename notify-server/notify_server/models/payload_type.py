"""The definition of payload types."""
from typing import Union, Dict, Any
from typing_extensions import Literal

from pydantic import BaseModel

from notify_server.models.hardware_event import HardwareEventPayload
from notify_server.models.sample_events import SampleOne, SampleTwo


class UserData(BaseModel):
    """Flexible user defined data."""

    type: Literal["UserData"] = "UserData"
    data: Dict[Any, Any]


# TODO (SPP, 2020-12-4): Remove sample events once there are > 1 real events
PayloadType = Union[
    SampleOne,
    SampleTwo,
    UserData,
    HardwareEventPayload,
]
