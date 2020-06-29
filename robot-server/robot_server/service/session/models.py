from enum import Enum
import typing
from uuid import uuid4

from pydantic import BaseModel, Field, validator
from robot_server.robot.calibration.check import models as calibration_models
from robot_server.robot.calibration.check.session import \
    CalibrationCheckTrigger

from robot_server.service.json_api import \
    ResponseDataModel, ResponseModel, RequestDataModel, RequestModel


IdentifierType = typing.NewType('IdentifierType', str)


def create_identifier() -> IdentifierType:
    """Create an identifier"""
    return IdentifierType(str(uuid4()))


class EmptyModel(BaseModel):
    pass


class SessionType(str, Enum):
    """The available session types"""
    null = 'null'
    default = 'default'
    calibration_check = 'calibrationCheck'
    tip_length_calibration = 'tipLengthCalibration'


SessionDetails = typing.Union[
    calibration_models.CalibrationSessionStatus,
    EmptyModel
]


class CommandName(str, Enum):
    """The available session commands"""
    home_all_motors = "home_all_motors"
    home_pipette = "home_pipette"
    toggle_lights = "toggle_lights"
    load_labware = CalibrationCheckTrigger.load_labware.value
    prepare_pipette = CalibrationCheckTrigger.prepare_pipette.value
    jog = (CalibrationCheckTrigger.jog.value,
           calibration_models.JogPosition)
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


CommandDataType = typing.Union[
    calibration_models.JogPosition,
    EmptyModel
]


class BasicSession(BaseModel):
    """Minimal session description"""
    sessionType: SessionType =\
        Field(...,
              description="The type of the session")


class Session(BasicSession):
    """Full description of session"""
    details: SessionDetails =\
        Field(...,
              description="Detailed session specific status")


class SessionCommand(BaseModel):
    """A session command"""
    data: CommandDataType
    # For validation, command MUST appear after data
    command: CommandName = Field(...,
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
