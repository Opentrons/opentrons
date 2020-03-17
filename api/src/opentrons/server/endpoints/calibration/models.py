import typing
from enum import Enum, IntEnum
from pydantic import BaseModel, Field, UUID4, dataclasses


@dataclasses.dataclass
class MountAxis(str, Enum):
    z = "z"
    a = "a"


@dataclasses.dataclass
class PlungerAxis(str, Enum):
    b = "b"
    c = "c"


@dataclasses.dataclass
class CalibrationCheckStates(IntEnum):
    """Normal states that can occur during a calibration check session."""
    sessionStart = 0
    specifyLabware = 1
    pickUpTip = 2
    checkPointOne = 3
    checkPointTwo = 4
    checkPointThree = 5
    checkHeight = 6
    sessionExit = 7


@dataclasses.dataclass
class CalibrationErrorStates(IntEnum):
    """Error states that can occur during a calibration check session."""
    badDeckCalibration = 8
    noPipettesAttached = 9


@dataclasses.dataclass
class CalibrationCheckStateMap:
    sessionStart = 1
    specifyLabware = 2
    pickUpTip = 3
    checkPointOne = 4
    checkPointTwo = 5
    checkPointThree = 6
    checkHeight = 3


class AttachedPipette(BaseModel):
    """Pipette (if any) attached to the mount"""
    model: typing.Optional[str]
    name: typing.Optional[str]
    tip_length: typing.Optional[float]
    mount_axis: typing.Optional[MountAxis]
    plunger_axis: typing.Optional[PlungerAxis]
    id: typing.Optional[str]


class Instruments(BaseModel):
    """None"""
    left_id: typing.Dict[UUID4, AttachedPipette]
    right_id: typing.Dict[UUID4, AttachedPipette]

    class Config:
        schema_extra = {
            "examples": [
                {
                    "fakeUUID4": {
                        "model": "p300_single_v1.5",
                        "name": "p300_single",
                        "tip_length": 51.7,
                        "mount_axis": "z",
                        "plunger_axis": "b",
                        "id": "P3HS12123041"
                    },
                    "fakeUUID2": {
                        "model": None,
                        "name": None,
                        "tip_length": None,
                        "mount_axis": "a",
                        "plunger_axis": "c",
                        "id": None
                    }
                }
            ]
        }


class CalibrationSessionStatus(BaseModel):
    instruments: typing.Dict[str, AttachedPipette]
    activeInstrument: typing.Optional[str]
    currentStep: str = Field(..., description="Current step of session")
    nextSteps: typing.Dict[str, typing.Dict[str, str]]
    sessionToken: str
