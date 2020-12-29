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
from pydantic.generics import GenericModel
from robot_server.service.legacy.models.control import Mount
from robot_server.service.json_api import (
    ResponseModel, RequestModel, ResponseDataModel)
from opentrons.util.helpers import utc_now


class LoadLabwareRequestData(BaseModel):
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


class LoadLabwareResponseData(BaseModel):
    labwareId: IdentifierType
    definition: LabwareDefinition
    calibration: OffsetVector


class LoadInstrumentRequestData(BaseModel):
    instrumentName: PipetteName = Field(
        ...,
        description="The name of the instrument model")
    mount: Mount


class LoadInstrumentResponseData(BaseModel):
    instrumentId: IdentifierType


class PipetteRequestDataBase(BaseModel):
    pipetteId: str
    labwareId: str
    wellId: str


class LiquidRequestData(PipetteRequestDataBase):
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


class SetHasCalibrationBlockRequestData(BaseModel):
    hasBlock: bool = Field(
        ...,
        description="whether or not there is a calibration block present")


CommandDataType = typing.Union[
    SetHasCalibrationBlockRequestData,
    JogPosition,
    LiquidRequestData,
    PipetteRequestDataBase,
    LoadLabwareRequestData,
    LoadInstrumentRequestData,
    EmptyModel
]

# A Union of all command result types
CommandResultType = typing.Union[
    LoadLabwareResponseData,
    LoadInstrumentResponseData,
]


class CommandStatus(str, Enum):
    """The command status"""
    executed = "executed"
    queued = "queued"
    failed = "failed"


RequestDataT = typing.TypeVar('RequestDataT', bound=BaseModel)


class SessionCommandRequest(GenericModel, typing.Generic[RequestDataT]):
    """A session command"""
    command: CommandDefinitionType = Field(
        ...,
        description="The command description")
    data: RequestDataT


class RobotCommandRequest(SessionCommandRequest[EmptyModel]):
    command: Literal[
        RobotCommand.home_all_motors,
        RobotCommand.home_pipette,
        RobotCommand.toggle_lights
    ]


class ProtocolCommandRequest(SessionCommandRequest[EmptyModel]):
    command: Literal[
        ProtocolCommand.start_run,
        ProtocolCommand.start_simulate,
        ProtocolCommand.cancel,
        ProtocolCommand.pause,
        ProtocolCommand.resume
    ]


class LoadLabwareRequest(SessionCommandRequest[LoadLabwareRequestData]):
    command: Literal[EquipmentCommand.load_labware]


class LoadInstrumentRequest(SessionCommandRequest[LoadInstrumentRequestData]):
    command: Literal[EquipmentCommand.load_instrument]


class LiquidRequest(SessionCommandRequest[LiquidRequestData]):
    command: Literal[
        PipetteCommand.aspirate,
        PipetteCommand.dispense
    ]


class TipRequest(SessionCommandRequest[PipetteRequestDataBase]):
    command: Literal[
        PipetteCommand.drop_tip,
        PipetteCommand.pick_up_tip
    ]


class CalibrationRequest(SessionCommandRequest[EmptyModel]):
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


class JogRequest(SessionCommandRequest[JogPosition]):
    command: Literal[CalibrationCommand.jog]


class SetHasCalibrationBlockRequestM(
    SessionCommandRequest[SetHasCalibrationBlockRequestData]
):
    command: Literal[CalibrationCommand.set_has_calibration_block]


class DeckCalibrationCommandRequest(SessionCommandRequest[EmptyModel]):
    command: Literal[
        DeckCalibrationCommand.move_to_point_two,
        DeckCalibrationCommand.move_to_point_three
    ]


class CheckCalibrationCommandRequest(SessionCommandRequest[EmptyModel]):
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
    LoadLabwareRequest,
    LoadInstrumentRequest,
    LiquidRequest,
    TipRequest,
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
