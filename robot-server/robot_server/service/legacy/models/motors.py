from enum import Enum

import typing
from pydantic import BaseModel, Field, validator, create_model

from opentrons.hardware_control import types


class MotorName(str, Enum):
    # opentrons.hardware_control.types.Axis as an int enum. We need this to
    # be a string enum of the keys in Axis. We will use _ignore_ and vars a la
    # https://docs.python.org/3/library/enum.html#timeperiod to
    # dynamically create an enum with the same keys as Axis but whose values
    # are also the keys. (ie X=0 becomes  X='X')
    _ignore_ = "MotorName _current_axis"
    MotorName = vars()
    for _current_axis in types.Axis:
        MotorName[_current_axis.name] = _current_axis.name.lower()


class EngagedMotor(BaseModel):
    """Engaged motor"""
    enabled: bool = Field(..., description="Is engine enabled")


# Dynamically create the Engaged motors. It has one EngagedMotor per MotorName
EngagedMotors = create_model(
    "EngagedMotors",
    __config__=None,
    __base__=None,
    __module__=None,
    __validators__=None,
    **{
        motor.value: (EngagedMotor, ...) for motor in MotorName
    }
)
EngagedMotors.__doc__ = "Which motors are engaged"


class Axes(BaseModel):
    """A list of motor axes to disengage"""
    axes: typing.List[MotorName]

    @validator('axes', pre=True)
    def lower_case_motor_name(cls, v):
        return [m.lower() for m in v]
