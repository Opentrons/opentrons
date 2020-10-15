"""The definition of payload types."""
from typing import Union, TYPE_CHECKING

from pydantic import BaseModel

if TYPE_CHECKING:
    SampleTwo = BaseModel
    SampleOne = BaseModel
else:
    from notify_server.models.sample_events import SampleTwo, SampleOne


PayloadType = Union[
    SampleOne,
    SampleTwo,
]
