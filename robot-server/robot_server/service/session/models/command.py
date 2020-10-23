from datetime import datetime
from enum import Enum
import typing

from opentrons_shared_data.labware.dev_types import LabwareDefinition
from opentrons_shared_data.pipette.dev_types import PipetteName
from robot_server.service.session.models.common import (
    EmptyModel, JogPosition, IdentifierType, OffsetVector)
from pydantic import BaseModel, Field, validator
from robot_server.service.legacy.models.control import Mount
from robot_server.service.json_api import (
    ResponseModel, RequestModel, ResponseDataModel)
from opentrons.util.helpers import utc_now


class LoadLabwareRequest(BaseModel):
    location: int = Field(
        ...,
        description="Deck slot", ge=1, lt=12)
    loadName: str = Field(
        ...,
        description="Name used to reference a labware definition")
    displayName: typing.Optional[str] = Field(
        ...,
        description="User-readable name for labware")
    namespace: str = Field(
        ...,
        description="The namespace the labware definition belongs to")
    version: int = Field(
        ...,
        description="The labware definition version")


class LoadLabwareResponse(BaseModel):
    labwareId: IdentifierType
    definition: LabwareDefinition
    calibration: OffsetVector


class LoadInstrumentRequest(BaseModel):
    instrumentName: PipetteName = Field(
        ...,
        description="The name of the instrument model")
    mount: Mount


class LoadInstrumentResponse(BaseModel):
    instrumentId: IdentifierType


class PipetteRequestBase(BaseModel):
    pipetteId: str
    labwareId: str
    wellId: str


class LiquidRequest(PipetteRequestBase):
    volume: float = Field(
        ...,
        description="Amount of liquid in uL. Must be greater than 0 and less "
                    "than a pipette-specific maximum volume.",
        gt=0,
    )
    offsetFromBottom: float = Field(
        ...,
        description="Offset from the bottom of the well in mm",
        gt=0,
    )
    flowRate: float = Field(
        ...,
        description="The absolute flow rate in uL/second. Must be greater "
                    "than 0 and less than a pipette-specific maximum flow "
                    "rate.",
        gt=0
    )


class SetHasCalibrationBlockRequest(BaseModel):
    hasBlock: bool = Field(
        ...,
        description="whether or not there is a calibration block present")


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


class EquipmentCommand(CommandDefinition):
    load_labware = ("loadLabware", LoadLabwareRequest)
    load_instrument = ("loadInstrument", LoadInstrumentRequest)

    @staticmethod
    def namespace():
        return "equipment"


class PipetteCommand(CommandDefinition):
    aspirate = ("aspirate", LiquidRequest)
    dispense = ("dispense", LiquidRequest)
    drop_tip = ("dropTip", PipetteRequestBase)
    pick_up_tip = ("pickUpTip", PipetteRequestBase)

    @staticmethod
    def namespace():
        return "pipette"


class CalibrationCommand(CommandDefinition):
    """Shared Between Calibration Flows"""
    load_labware = "loadLabware"
    jog = ("jog", JogPosition)
    set_has_calibration_block = ("setHasCalibrationBlock",
                                 SetHasCalibrationBlockRequest)
    move_to_tip_rack = "moveToTipRack"
    move_to_point_one = "moveToPointOne"
    move_to_deck = "moveToDeck"
    move_to_reference_point = "moveToReferencePoint"
    pick_up_tip = "pickUpTip"
    confirm_tip_attached = "confirmTip"
    invalidate_tip = "invalidateTip"
    save_offset = "saveOffset"
    exit = "exitSession"
    invalidate_last_action = "invalidateLastAction"

    @staticmethod
    def namespace():
        return "calibration"


class DeckCalibrationCommand(CommandDefinition):
    """Deck Calibration Specific"""
    move_to_point_two = "moveToPointTwo"
    move_to_point_three = "moveToPointThree"

    @staticmethod
    def namespace():
        return "calibration.deck"


class CheckCalibrationCommand(CommandDefinition):
    """Check Calibration Health Specific"""
    compare_point = "comparePoint"
    switch_pipette = "switchPipette"
    return_tip = "returnTip"
    transition = "transition"

    @staticmethod
    def namespace():
        return "calibration.check"


"""
IMPORTANT: See note for SessionCreateParamType

Read more here: https://pydantic-docs.helpmanual.io/usage/types/#unions
"""
CommandDataType = typing.Union[
    SetHasCalibrationBlockRequest,
    JogPosition,
    LiquidRequest,
    PipetteRequestBase,
    LoadLabwareRequest,
    LoadInstrumentRequest,
    EmptyModel
]


# A Union of all CommandDefinition enumerations accepted
CommandDefinitionType = typing.Union[
    RobotCommand,
    CalibrationCommand,
    CheckCalibrationCommand,
    DeckCalibrationCommand,
    ProtocolCommand,
    PipetteCommand,
    EquipmentCommand,
]

# A Union of all command result types
CommandResultType = typing.Union[
    LoadLabwareResponse,
    LoadInstrumentResponse,
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


class SessionCommand(ResponseDataModel, BasicSessionCommand):
    """A session command response"""
    status: CommandStatus
    createdAt: datetime = Field(..., default_factory=utc_now)
    startedAt: typing.Optional[datetime]
    completedAt: typing.Optional[datetime]
    result: typing.Optional[CommandResultType] = None


# Session command requests/responses
CommandRequest = RequestModel[
    BasicSessionCommand
]
CommandResponse = ResponseModel[
    SessionCommand
]
