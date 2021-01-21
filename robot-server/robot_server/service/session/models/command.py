"""Modeling of session commands.

Creating a new command type requires these steps:
1) Creation of a CommandDefinition enum identifying the command
type.

2) If necessary, define a data payload model.

3) If necessary, define a result payload model.

4) Create specialized `SessionCommandRequest` and `SessionCommandResponse`
types using the CommandDefinition Literal(s), data, and result payload models.
If there are no data and result models, then add the CommandDefinition to
`CommandsEmptyData` type.

5) If not using `CommandsEmptyData` then add specialized request and response
types to `RequestTypes` and `ResponseTypes`.
"""
from datetime import datetime
from enum import Enum
import typing

from typing_extensions import Literal
from pydantic import BaseModel, Field
from pydantic.generics import GenericModel

from opentrons.util.helpers import utc_now
from opentrons.protocol_engine import commands

from robot_server.service.session.models.command_definitions import (
    ProtocolCommand, EquipmentCommand, PipetteCommand, CalibrationCommand,
    DeckCalibrationCommand, CheckCalibrationCommand, CommandDefinitionType)
from robot_server.service.session.models.common import (
    EmptyModel, JogPosition)
from robot_server.service.json_api import (
    ResponseModel, RequestModel, ResponseDataModel)


class LoadLabwareByDefinitionRequestData(BaseModel):
    tiprackDefinition: typing.Optional[dict] = Field(
        None,
        description="The tiprack definition to load into a user flow")


class SetHasCalibrationBlockRequestData(BaseModel):
    hasBlock: bool = Field(
        ...,
        description="whether or not there is a calibration block present")


class CommandStatus(str, Enum):
    """The command status."""
    executed = "executed"
    queued = "queued"
    failed = "failed"


CommandT = typing.TypeVar('CommandT', bound=CommandDefinitionType)
RequestDataT = typing.TypeVar('RequestDataT', bound=BaseModel)
ResponseDataT = typing.TypeVar('ResponseDataT')


class SessionCommandRequest(
    GenericModel,
    typing.Generic[CommandT, RequestDataT, ResponseDataT]
):
    """A session command request."""
    command: CommandT = Field(
        ...,
        description="The command description")
    data: RequestDataT = Field(
        ...,
        description="The command data"
    )

    def make_response(
            self,
            identifier: str,
            status: CommandStatus,
            created_at: datetime,
            started_at: typing.Optional[datetime],
            completed_at: typing.Optional[datetime],
            result: typing.Optional[ResponseDataT]
    ) -> 'SessionCommandResponse[CommandT, RequestDataT, ResponseDataT]':
        """Create a SessionCommandResponse object."""
        return SessionCommandResponse(
            command=self.command,
            data=self.data,
            id=identifier,
            status=status,
            createdAt=created_at,
            startedAt=started_at,
            completedAt=completed_at,
            result=result)


class SessionCommandResponse(
    ResponseDataModel,
    GenericModel,
    typing.Generic[CommandT, RequestDataT, ResponseDataT]
):
    """A session command response."""
    command: CommandT
    data: RequestDataT
    status: CommandStatus
    createdAt: datetime = Field(..., default_factory=utc_now)
    startedAt: typing.Optional[datetime]
    completedAt: typing.Optional[datetime]
    result: typing.Optional[ResponseDataT] = None


CommandsEmptyData = Literal[
    ProtocolCommand.start_run,
    ProtocolCommand.start_simulate,
    ProtocolCommand.cancel,
    ProtocolCommand.pause,
    ProtocolCommand.resume,
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
    DeckCalibrationCommand.move_to_point_two,
    DeckCalibrationCommand.move_to_point_three,
    CheckCalibrationCommand.compare_point,
    CheckCalibrationCommand.switch_pipette,
    CheckCalibrationCommand.return_tip,
    CheckCalibrationCommand.transition
]
"""The command definitions requiring no data and result types."""


SimpleCommandRequest = SessionCommandRequest[
    CommandsEmptyData,
    EmptyModel,
    EmptyModel]
"""A command request containing no data and result type."""


SimpleCommandResponse = SessionCommandResponse[
    CommandsEmptyData,
    EmptyModel,
    EmptyModel
]
"""Response to :class:`~SimpleCommandRequest`"""


LoadLabwareRequest = SessionCommandRequest[
    Literal[EquipmentCommand.load_labware],
    commands.LoadLabwareRequest,
    commands.LoadLabwareResult
]


LoadLabwareResponse = SessionCommandResponse[
    Literal[EquipmentCommand.load_labware],
    commands.LoadLabwareRequest,
    commands.LoadLabwareResult
]


LoadInstrumentRequest = SessionCommandRequest[
    Literal[EquipmentCommand.load_instrument],
    commands.LoadPipetteRequest,
    commands.LoadPipetteResult
]


LoadInstrumentResponse = SessionCommandResponse[
    Literal[EquipmentCommand.load_instrument],
    commands.LoadPipetteRequest,
    commands.LoadPipetteResult
]


AspirateRequest = SessionCommandRequest[
    Literal[PipetteCommand.aspirate],
    commands.AspirateRequest,
    commands.AspirateResult
]


AspirateResponse = SessionCommandResponse[
    Literal[PipetteCommand.aspirate],
    commands.AspirateRequest,
    commands.AspirateResult
]


DispenseRequest = SessionCommandRequest[
    Literal[PipetteCommand.dispense],
    commands.DispenseRequest,
    commands.DispenseResult
]


DispenseResponse = SessionCommandResponse[
    Literal[PipetteCommand.dispense],
    commands.DispenseRequest,
    commands.DispenseResult
]


PickUpTipRequest = SessionCommandRequest[
    Literal[PipetteCommand.pick_up_tip],
    commands.PickUpTipRequest,
    commands.PickUpTipResult
]


PickUpTipResponse = SessionCommandResponse[
    Literal[PipetteCommand.pick_up_tip],
    commands.PickUpTipRequest,
    commands.PickUpTipResult
]


DropTipRequest = SessionCommandRequest[
    Literal[PipetteCommand.drop_tip],
    commands.DropTipRequest,
    commands.DropTipResult
]


DropTipResponse = SessionCommandResponse[
    Literal[PipetteCommand.drop_tip],
    commands.DropTipRequest,
    commands.DropTipResult
]


JogRequest = SessionCommandRequest[
    Literal[CalibrationCommand.jog],
    JogPosition,
    EmptyModel
]


JogResponse = SessionCommandResponse[
    Literal[CalibrationCommand.jog],
    JogPosition,
    EmptyModel
]


LabwareByDefinitionRequest = SessionCommandRequest[
    Literal[CalibrationCommand.load_labware],
    LoadLabwareByDefinitionRequestData,
    EmptyModel
]


LabwareByDefinitionResponse = SessionCommandResponse[
    Literal[CalibrationCommand.load_labware],
    LoadLabwareByDefinitionRequestData,
    EmptyModel
]


SetHasCalibrationBlockRequest = SessionCommandRequest[
    Literal[CalibrationCommand.set_has_calibration_block],
    SetHasCalibrationBlockRequestData,
    EmptyModel
]


SetHasCalibrationBlockResponse = SessionCommandResponse[
    Literal[CalibrationCommand.set_has_calibration_block],
    SetHasCalibrationBlockRequestData,
    EmptyModel]


RequestTypes = typing.Union[
    SimpleCommandRequest,
    LoadLabwareRequest,
    LoadInstrumentRequest,
    AspirateRequest,
    DispenseRequest,
    PickUpTipRequest,
    DropTipRequest,
    JogRequest,
    SetHasCalibrationBlockRequest,
    LabwareByDefinitionRequest
]
"""Union of all request types"""

ResponseTypes = typing.Union[
    SimpleCommandResponse,
    LoadLabwareResponse,
    LoadInstrumentResponse,
    AspirateResponse,
    DispenseResponse,
    PickUpTipResponse,
    DropTipResponse,
    JogResponse,
    SetHasCalibrationBlockResponse,
    LabwareByDefinitionResponse
]
"""Union of all response types"""


CommandRequest = RequestModel[
    RequestTypes
]
"""The command request model."""

CommandResponse = ResponseModel[
    ResponseTypes
]
"""The command response model."""
