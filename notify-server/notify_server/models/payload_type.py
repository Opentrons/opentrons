"""The definition of payload types."""
from typing import Union, Dict, Any
from typing_extensions import Literal

from pydantic import BaseModel

from notify_server.models.hardware_event import HardwareEventPayload


class UserData(BaseModel):
    """Flexible user defined data."""

    type: Literal["UserData"] = "UserData"
    data: Dict[Any, Any]


PayloadType = Union[
    UserData,
    HardwareEventPayload,
]
