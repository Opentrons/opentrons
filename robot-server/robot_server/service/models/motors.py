from enum import Enum

import typing
from pydantic import BaseModel, Field, validator


class EngagedMotor(BaseModel):
    """Engaged motor"""
    enabled: bool = Field(..., description="Is engine enabled")


class EngagedMotors(BaseModel):
    """Which motors are engaged"""
    x: EngagedMotor
    y: EngagedMotor
    z: EngagedMotor
    a: EngagedMotor
    b: EngagedMotor
    c: EngagedMotor

    class Config:
        schema_extra = {"example": {
            "x": {"enabled": False},
            "y": {"enabled": True},
            "z": {"enabled": False},
            "a": {"enabled": True},
            "b": {"enabled": False},
            "c": {"enabled": True}
        }}


class MotorName(str, Enum):
    x = "x"
    y = "y"
    z = "z"
    a = "a"
    b = "b"
    c = "c"


class Axes(BaseModel):
    """A list of motor axes to disengage"""
    axes: typing.List[MotorName]

    @validator('axes', pre=True)
    def lower_case_motor_name(cls, v):
        return [m.lower() for m in v]
