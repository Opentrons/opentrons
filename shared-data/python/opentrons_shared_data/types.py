"""Shared-data types."""

from typing import Generic, TypeVar
from pydantic import (
    BaseModel,
    StrictInt,
    StrictFloat,
    NonNegativeInt,
    NonNegativeFloat,
)


Number = StrictInt | StrictFloat
NonNegativeNumber = NonNegativeInt | NonNegativeFloat

NumberType = TypeVar("NumberType")


class Vec3f(BaseModel, Generic[NumberType]):
    """A 3D Vector."""

    x: NumberType
    y: NumberType
    z: NumberType
