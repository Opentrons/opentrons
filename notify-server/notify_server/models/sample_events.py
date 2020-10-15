"""Sample event models."""
from pydantic import create_model, BaseModel
from typing_extensions import Literal


sample_one = Literal["SampleOne"]
sample_two = Literal["SampleTwo"]


class SampleOneData(BaseModel):
    """Sample data field of SampleOne payload."""

    val1: int
    val2: str


# An example of a payload with a type and data member
SampleOne = create_model('SampleOne',
                         type=(sample_one, "SampleOne"),
                         data=(SampleOneData, ...))

# An example of a payload with type and other attributes.
SampleTwo = create_model('SampleTwo',
                         type=(sample_two, "SampleTwo"),
                         val1=(int, ...),
                         val2=(str, ...))
