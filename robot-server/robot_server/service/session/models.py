from datetime import datetime
from enum import Enum
import typing
from functools import lru_cache
from uuid import uuid4

from pydantic import BaseModel, Field, validator
from robot_server.robot.calibration.check import (
    models as calibration_check_models)
from robot_server.robot.calibration.tip_length import (
    models as tip_length_calibration_models)
from robot_server.robot.calibration.deck import (
    models as deck_calibration_models)
from robot_server.robot.calibration.pipette_offset import (
    models as pipette_offset_calibration_models)
from robot_server.service.session.session_types.protocol import \
    models as protocol_session_models
from robot_server.service.json_api import \
    ResponseDataModel, ResponseModel, RequestDataModel, RequestModel
from opentrons.util.helpers import utc_now

IdentifierType = typing.NewType('IdentifierType', str)


def create_identifier() -> IdentifierType:
    """Create an identifier"""
    return IdentifierType(str(uuid4()))


class EmptyModel(BaseModel):
    pass


OffsetVector = typing.Tuple[float, float, float]


class JogPosition(BaseModel):
    vector: OffsetVector


class ProtocolCreateParams(BaseModel):
    protocolId: str


class SessionType(str, Enum):
    """The available session types"""
    def __new__(cls, value, create_param_model=None):
        """Create a session type enum with the optional create param model

        IMPORTANT: Model definition must appear in SessionCreateParamType
        Union below.
        """
        # Ignoring type errors because this is exactly as described here
        # https://docs.python.org/3/library/enum.html#when-to-use-new-vs-init
        obj = str.__new__(cls, value)  # type: ignore
        obj._value_ = value
        obj._model = create_param_model
        return obj

    null = 'null'
    default = 'default'
    calibration_check = 'calibrationCheck'
    tip_length_calibration = (
        'tipLengthCalibration',
        tip_length_calibration_models.SessionCreateParams
    )
    deck_calibration = 'deckCalibration'
    pipette_offset_calibration = (
        'pipetteOffsetCalibration',
        pipette_offset_calibration_models.SessionCreateParams
    )
    protocol = ('protocol', ProtocolCreateParams)

    @property
    def model(self):
        """Get the data model of the create param model"""
        return self._model  # type: ignore


"""
IMPORTANT: Models in this Union should be sorted by specificity. If model A
has `name`, `type` attributes and model B has just `name`, then model A must
come first.

Read more here: https://pydantic-docs.helpmanual.io/usage/types/#unions

When we move to Python 3.8 we can use Literal type as described here
https://pydantic-docs.helpmanual.io/usage/types/#literal-type
"""
SessionCreateParamType = typing.Union[
    tip_length_calibration_models.SessionCreateParams,
    pipette_offset_calibration_models.SessionCreateParams,
    ProtocolCreateParams,
    None,
    EmptyModel
]

"""
IMPORTANT: See note for SessionCreateParamType

Read more here: https://pydantic-docs.helpmanual.io/usage/types/#unions
"""
SessionDetails = typing.Union[
    calibration_check_models.CalibrationSessionStatus,
    tip_length_calibration_models.TipCalibrationSessionStatus,
    deck_calibration_models.DeckCalibrationSessionStatus,
    pipette_offset_calibration_models.PipetteOffsetCalibrationSessionStatus,
    protocol_session_models.ProtocolSessionDetails,
    EmptyModel
]


class CommandStatus(str, Enum):
    """The command status"""
    executed = "executed"
    queued = "queued"
    failed = "failed"


class CommandDefinition(str, Enum):
    def __new__(cls, value, model=EmptyModel):
        """Create a string enum with the expected model

        IMPORTANT: Model definition must appear in CommandDataType
        Union below.
        """
        namespace = cls.namespace()
        full_name = f"{namespace}.{value}" if namespace else value
        # Ignoring type errors because this is exactly as described here
        # https://docs.python.org/3/library/enum.html#when-to-use-new-vs-init
        obj = str.__new__(cls, full_name)  # type: ignore
        obj._value_ = full_name
        obj._localname = value
        obj._model = model
        return obj

    @property
    def model(self):
        """Get the data model of the payload of the command"""
        return self._model  # type: ignore

    @staticmethod
    def namespace():
        """
        This is primarily for allowing  definitions to define a
        namespace. The name space will be used to make the value of the
        enum. It will be "{namespace}.{value}"
        """
        return None

    @property
    def localname(self):
        """Get the name of the command without the namespace"""
        return self._localname  # type: ignore


class RobotCommand(CommandDefinition):
    """Robot commands"""
    home_all_motors = "homeAllMotors"
    home_pipette = "homePipette"
    toggle_lights = "toggleLights"

    @staticmethod
    def namespace():
        return "robot"


class ProtocolCommand(CommandDefinition):
    """Protocol commands"""
    start_run = "startRun"
    start_simulate = "startSimulate"
    cancel = "cancel"
    pause = "pause"
    resume = "resume"

    @staticmethod
    def namespace():
        return "protocol"


class CalibrationCommand(CommandDefinition):
    """Shared Between Calibration Flows"""
    load_labware = "loadLabware"
    jog = ("jog", JogPosition)
    move_to_tip_rack = "moveToTipRack"
    move_to_point_one = "moveToPointOne"
    move_to_deck = "moveToDeck"
    move_to_reference_point = "moveToReferencePoint"
    pick_up_tip = "pickUpTip"
    confirm_tip_attached = "confirmTip"
    invalidate_tip = "invalidateTip"
    save_offset = "saveOffset"
    exit = "exitSession"

    @staticmethod
    def namespace():
        return "calibration"


class CalibrationCheckCommand(CommandDefinition):
    """Cal Check Specific"""
    prepare_pipette = "preparePipette"
    compare_point = "comparePoint"
    go_to_next_check = "goToNextCheck"
    # TODO: remove unused command name and trigger
    reject_calibration = "rejectCalibration"

    @staticmethod
    def namespace():
        return "calibration.check"


class TipLengthCalibrationCommand(CommandDefinition):
    """Tip Length Calibration Specific"""
    move_to_reference_point = "moveToReferencePoint"

    @staticmethod
    def namespace():
        return "calibration.tipLength"


class DeckCalibrationCommand(CommandDefinition):
    """Deck Calibration Specific"""
    move_to_point_two = "moveToPointTwo"
    move_to_point_three = "moveToPointThree"

    @staticmethod
    def namespace():
        return "calibration.deck"


"""
IMPORTANT: See note for SessionCreateParamType

Read more here: https://pydantic-docs.helpmanual.io/usage/types/#unions
"""
CommandDataType = typing.Union[
    JogPosition,
    EmptyModel
]


# A Union of all CommandDefinition enumerations accepted
CommandDefinitionType = typing.Union[
    RobotCommand,
    CalibrationCommand,
    CalibrationCheckCommand,
    TipLengthCalibrationCommand,
    DeckCalibrationCommand,
    ProtocolCommand
]


class BasicSession(BaseModel):
    """Attributes required for creating a session"""
    createParams: SessionCreateParamType
    # For validation, sessionType MUST appear after createParams
    sessionType: SessionType =\
        Field(...,
              description="The type of the session")

    @validator('sessionType', always=True, allow_reuse=True)
    def check_data_type(cls, v, values):
        """Validate that the session type and create params model match"""
        create_params = values.get('createParams')
        if v.model is None:
            # If model is None then we will accept either None or an
            # EmptyModel (ie "{}")
            is_valid_type = create_params is None or\
                            isinstance(create_params, EmptyModel)
        else:
            is_valid_type = isinstance(create_params, v.model)

        if not is_valid_type:
            raise ValueError(f"Invalid create param for session type {v}. "
                             f"Expecting {v.model}")
        return v


class Session(BasicSession):
    """The attributes of a created session"""
    details: SessionDetails =\
        Field(...,
              description="Detailed session specific status")
    createdAt: datetime = \
        Field(...,
              description="Date and time that this session was created")


class BasicSessionCommand(BaseModel):
    """A session command"""
    data: CommandDataType
    # For validation, command MUST appear after data
    command: CommandDefinitionType = Field(
        ...,
        description="The command description")

    @validator('command', always=True, allow_reuse=True)
    def check_data_type(cls, v, values):
        """Validate that the command and data match"""
        d = values.get('data')
        if not isinstance(d, v.model):
            raise ValueError(f"Invalid command data for command type {v}. "
                             f"Expecting {v.model}")
        return v

    @validator('command', pre=True)
    def pre_namespace_backwards_compatibility(cls, v):
        """Support commands that were released before namespace."""
        # TODO: AmitL 2020.7.9. Remove this backward compatibility once
        #  clients reliably use fully namespaced command names
        return BasicSessionCommand._pre_namespace_mapping().get(v, v)

    @staticmethod
    @lru_cache(maxsize=1)
    def _pre_namespace_mapping() -> typing.Dict[str, CommandDefinition]:
        """Create a dictionary of pre-namespace name to CommandDefinition"""
        # A tuple of CommandDefinition enums which need to be identified by
        # localname and full namespaced name
        pre_namespace_ns = CalibrationCheckCommand, CalibrationCommand
        # Flatten
        t = tuple(v for k in pre_namespace_ns for v in k)
        return {k.localname: k for k in t}


class SessionCommand(BasicSessionCommand):
    """A session command response"""
    status: CommandStatus
    createdAt: datetime = Field(..., default_factory=utc_now)
    startedAt: typing.Optional[datetime]
    completedAt: typing.Optional[datetime]


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
    RequestDataModel[BasicSessionCommand]
]
CommandResponse = ResponseModel[
    ResponseDataModel[SessionCommand], dict
]
