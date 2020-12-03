"""The definition of payload types."""
from typing import Union
from pydantic import BaseModel
from notify_server.models.sample_events import SampleOne, SampleTwo
from opentrons.hardware_control.types import HardwareEvent


class HardwareEventPayload(BaseModel):
    """Payload for events originating in hardware.

    Includes door event,..
    """

    val: HardwareEvent

    class Config:
        """Allow use of arbitrary types.

        Needed for DoorStateNotification dataclass.
        """

        arbitrary_types_allowed = True


PayloadType = Union[
    SampleOne,
    SampleTwo,
    HardwareEventPayload,
]
