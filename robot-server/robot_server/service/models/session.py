from enum import Enum
import typing

from opentrons.server.endpoints.calibration.models import JogPosition,\
    SpecificPipette
from opentrons.server.endpoints.calibration.session import \
    CalibrationCheckTrigger
from pydantic import BaseModel, Field, validator


class SessionCommands(str, Enum):
    """The available session commands"""
    load_labware =\
        (CalibrationCheckTrigger.load_labware.value, None)
    prepare_pipette =\
        (CalibrationCheckTrigger.prepare_pipette.value, SpecificPipette)
    jog =\
        (CalibrationCheckTrigger.jog.value, JogPosition)
    pick_up_tip =\
        (CalibrationCheckTrigger.pick_up_tip.value, SpecificPipette)
    confirm_tip_attached = \
        (CalibrationCheckTrigger.confirm_tip_attached.value, SpecificPipette)
    invalidate_tip =\
        (CalibrationCheckTrigger.invalidate_tip.value, SpecificPipette)
    confirm_step = \
        (CalibrationCheckTrigger.confirm_step.value, SpecificPipette)
    exit = \
        (CalibrationCheckTrigger.exit.value, SpecificPipette)
    reject_calibration = \
        (CalibrationCheckTrigger.reject_calibration.value, SpecificPipette)

    def __new__(cls, value, model):
        """Create a string enum with the expected model"""
        obj = str.__new__(cls, value)
        obj._value_ = value
        obj._model = model
        return obj

    @property
    def model(self):
        return self._model


SessionCommandTypes = typing.Union[None, JogPosition, SpecificPipette]


class SessionType(str, Enum):
    calibration_check = "calibration_check"
    deck_calibration = "deck_calibration"
    protocol = "protocol"


class Session(BaseModel):
    """Description of session"""
    session_type: SessionType =\
        Field(..., description="The type of the session")
    session_id: str = \
        Field(..., description="The unique identifier the session")


class SessionCommand(BaseModel):
    """A session command"""
    data: SessionCommandTypes
    # For validation, command MUST appear after data
    command: SessionCommands = Field(..., description="The command description")
    status: typing.Optional[str]

    @validator('command', always=True)
    def check_data_type(cls, v, values):
        """Validate that the command and data match"""
        d = values.get('data')
        if v.model != d:
            raise ValueError(f"Invalid command data for command type {v}. "
                             f"Expecting {v.model}")
        return v
