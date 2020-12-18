from datetime import datetime
from enum import Enum
import typing

from opentrons_shared_data.labware.dev_types import LabwareDefinition
from opentrons_shared_data.pipette.dev_types import PipetteName
from typing_extensions import Literal

from robot_server.service.session.models.command_definitions import \
    CommandDefinitionType, RobotCommand, ProtocolCommand, EquipmentCommand, \
    PipetteCommand, CalibrationCommand, DeckCalibrationCommand, \
    CheckCalibrationCommand
from robot_server.service.session.models.common import (
    EmptyModel, JogPosition, IdentifierType, OffsetVector)
from pydantic import BaseModel, Field
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


CommandDataType = typing.Union[
    SetHasCalibrationBlockRequest,
    JogPosition,
    LiquidRequest,
    PipetteRequestBase,
    LoadLabwareRequest,
    LoadInstrumentRequest,
    EmptyModel
]

# A Union of all command result types
CommandResultType = typing.Union[
    LoadLabwareResponse,
    LoadInstrumentResponse,
]


class CommandStatus(str, Enum):
    """The command status"""
    executed = "executed"
    queued = "queued"
    failed = "failed"


class BasicSessionCommand(BaseModel):
    """A session command"""
    command: CommandDefinitionType = Field(
        ...,
        description="The command description")


class EmptySessionCommand(BasicSessionCommand):
    data: EmptyModel


class RobotCommandRequest(EmptySessionCommand):
    command: Literal[
        RobotCommand.home_all_motors,
        RobotCommand.home_pipette,
        RobotCommand.toggle_lights
    ]


class ProtocolCommandRequest(EmptySessionCommand):
    command: Literal[
        ProtocolCommand.start_run,
        ProtocolCommand.start_simulate,
        ProtocolCommand.cancel,
        ProtocolCommand.pause,
        ProtocolCommand.resume
    ]


class LoadLabwareRequestM(BasicSessionCommand):
    command: Literal[EquipmentCommand.load_labware]
    data: LoadLabwareRequest


class LoadInstrumentRequestM(BasicSessionCommand):
    command: Literal[EquipmentCommand.load_instrument]
    data: LoadInstrumentRequest


class LiquidRequestM(BasicSessionCommand):
    command: Literal[
        PipetteCommand.aspirate,
        PipetteCommand.dispense
    ]
    data: LiquidRequest


class TipRequestM(BasicSessionCommand):
    command: Literal[
        PipetteCommand.drop_tip,
        PipetteCommand.pick_up_tip
    ]
    data: PipetteRequestBase


class CalibrationRequest(EmptySessionCommand):
    command: Literal[
        CalibrationCommand.load_labware,
        CalibrationCommand.move_to_tip_rack,
        CalibrationCommand.move_to_point_one,
        CalibrationCommand.move_to_deck,
        CalibrationCommand.move_to_reference_point,
        CalibrationCommand.pick_up_tip,
        CalibrationCommand.confirm_tip_attached,
        CalibrationCommand.invalidate_tip,
        CalibrationCommand.save_offset,
        CalibrationCommand.exit,
        CalibrationCommand.invalidate_last_action,
    ]


class JogRequest(BasicSessionCommand):
    command: Literal[CalibrationCommand.jog]
    data: JogPosition


class SetHasCalibrationBlockRequestM(BasicSessionCommand):
    command: Literal[CalibrationCommand.set_has_calibration_block]
    data: SetHasCalibrationBlockRequest


class DeckCalibrationCommandRequest(EmptySessionCommand):
    command: Literal[
        DeckCalibrationCommand.move_to_point_two,
        DeckCalibrationCommand.move_to_point_three
    ]


class CheckCalibrationCommandRequest(EmptySessionCommand):
    command: Literal[
        CheckCalibrationCommand.compare_point,
        CheckCalibrationCommand.switch_pipette,
        CheckCalibrationCommand.return_tip,
        CheckCalibrationCommand.transition
    ]


class SessionCommand(ResponseDataModel):
    """A session command response"""
    command: CommandDefinitionType
    data: CommandDataType
    status: CommandStatus
    createdAt: datetime = Field(..., default_factory=utc_now)
    startedAt: typing.Optional[datetime]
    completedAt: typing.Optional[datetime]
    result: typing.Optional[CommandResultType] = None


RequestTypes = typing.Union[
    RobotCommandRequest,
    ProtocolCommandRequest,
    LoadLabwareRequestM,
    LoadInstrumentRequestM,
    LiquidRequestM,
    TipRequestM,
    CalibrationRequest,
    JogRequest,
    SetHasCalibrationBlockRequestM,
    DeckCalibrationCommandRequest,
    CheckCalibrationCommandRequest
]

# Session command requests/responses
CommandRequest = RequestModel[
    RequestTypes
]
CommandResponse = ResponseModel[
    SessionCommand
]
