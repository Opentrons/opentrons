from enum import Enum
import typing

from pydantic import BaseModel, Field, validator
from opentrons.calibration.check import models as calibration_models
from opentrons.calibration.check.session import CalibrationCheckTrigger

from robot_server.service.json_api import \
    ResponseDataModel, ResponseModel, RequestDataModel, RequestModel


SessionDetails = typing.Union[calibration_models.CalibrationSessionStatus]


class EmptyModel(BaseModel):
    pass


class SessionCommands(str, Enum):
    """The available session commands"""
    load_labware = CalibrationCheckTrigger.load_labware.value
    prepare_pipette = CalibrationCheckTrigger.prepare_pipette.value
    jog =\
        (CalibrationCheckTrigger.jog.value, calibration_models.JogPosition)
    pick_up_tip = CalibrationCheckTrigger.pick_up_tip.value
    confirm_tip_attached = CalibrationCheckTrigger.confirm_tip_attached.value
    invalidate_tip = CalibrationCheckTrigger.invalidate_tip.value
    compare_point = CalibrationCheckTrigger.compare_point.value
    confirm_step = CalibrationCheckTrigger.go_to_next_check.value
    exit = CalibrationCheckTrigger.exit.value
    reject_calibration = CalibrationCheckTrigger.reject_calibration.value

    def __new__(cls, value, model=EmptyModel):
        """Create a string enum with the expected model"""
        obj = str.__new__(cls, value)
        obj._value_ = value
        obj._model = model
        return obj

    @property
    def model(self):
        return self._model


SessionCommandTypes = typing.Union[
    calibration_models.JogPosition,
    EmptyModel
]


class BasicSession(BaseModel):
    """Minimal session description"""
    sessionType: calibration_models.SessionType =\
        Field(...,
              description="The type of the session")


class Session(BasicSession):
    """Full description of session"""
    details: SessionDetails =\
        Field(...,
              description="Detailed session specific status")


class SessionCommand(BaseModel):
    """A session command"""
    data: SessionCommandTypes
    # For validation, command MUST appear after data
    command: SessionCommands = Field(...,
                                     description="The command description")
    status: typing.Optional[str]

    @validator('command', always=True)
    def check_data_type(cls, v, values):
        """Validate that the command and data match"""
        d = values.get('data')
        if not isinstance(d, v.model):
            raise ValueError(f"Invalid command data for command type {v}. "
                             f"Expecting {v.model}")
        return v


# Session create and query requests/responses
SessionCreateRequest = RequestModel[
    RequestDataModel[BasicSession]
]
SessionResponse = ResponseModel[
    ResponseDataModel[Session], dict
]
MultiSessionResponse = ResponseModel[
    typing.List[ResponseDataModel[Session]], dict
]

# Session command requests/responses
CommandRequest = RequestModel[
    RequestDataModel[SessionCommand]
]
CommandResponse = ResponseModel[
    ResponseDataModel[SessionCommand], dict
]
