from datetime import datetime
from enum import Enum
from typing import Union, TypeVar, Generic, Optional
from typing_extensions import Literal

from opentrons.util.helpers import utc_now
from pydantic import BaseModel, Field
from pydantic.generics import GenericModel

from robot_server.service.json_api import RequestModel, RequestDataModel, \
    ResponseModel, ResponseDataModel
from robot_server.service.session.models.common import JogPosition, EmptyModel


class CommandStatus(str, Enum):
    """The command status"""
    executed = "executed"
    queued = "queued"
    failed = "failed"


class CommandDefinition(str, Enum):
    def __new__(cls, value):
        """Create a string enum with the expected model"""
        namespace = cls.namespace()
        full_name = f"{namespace}.{value}" if namespace else value
        # Ignoring type errors because this is exactly as described here
        # https://docs.python.org/3/library/enum.html#when-to-use-new-vs-init
        obj = str.__new__(cls, full_name)  # type: ignore
        obj._value_ = full_name
        obj._localname = value
        return obj

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
    jog = "jog"
    move_to_tip_rack = "moveToTipRack"
    move_to_point_one = "moveToPointOne"
    move_to_deck = "moveToDeck"
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


# A Union of all CommandDefinition enumerations accepted
CommandDefinitionType = Union[
    RobotCommand,
    CalibrationCommand,
    CalibrationCheckCommand,
    TipLengthCalibrationCommand,
    DeckCalibrationCommand,
    ProtocolCommand
]


class SessionCommandCreateAttributes(BaseModel):
    """Attributes used to create a session"""
    command: CommandDefinitionType = Field(
        ...,
        description="The command description")
    data: BaseModel = Field(
        ...,
        description="Data associated with command"
    )


class CalibrationJogCommand(SessionCommandCreateAttributes):
    command = Literal[CalibrationCommand.jog]
    data: JogPosition


CommandResponseDataT = TypeVar('CommandResponseDataT')


class SessionCommandResponseAttributes(SessionCommandCreateAttributes):
    """A session command response"""
    status: CommandStatus
    createdAt: datetime = Field(..., default_factory=utc_now)
    startedAt: Optional[datetime]
    completedAt: Optional[datetime]


CommandCreateType = Union[
    RequestModel[RequestDataModel[CalibrationJogCommand]],
    RequestModel[RequestDataModel[SessionCommandCreateAttributes]],
]

CommandResponseType = ResponseModel[
    ResponseDataModel[SessionCommandResponseAttributes], dict
]
