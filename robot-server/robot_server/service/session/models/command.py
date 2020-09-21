from datetime import datetime
from enum import Enum
import typing
from functools import lru_cache

from pydantic import BaseModel, Field, validator
from robot_server.service.json_api import ResponseModel, RequestModel
from opentrons.util.helpers import utc_now

from robot_server.service.session.models.common import EmptyModel, \
    JogPosition


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


# Session command requests/responses
CommandRequest = RequestModel[
    BasicSessionCommand
]
CommandResponse = ResponseModel[
    SessionCommand, dict
]
