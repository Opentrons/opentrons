from datetime import datetime
from enum import Enum

import typing

from pydantic import BaseModel, Field
from typing_extensions import Literal

from robot_server.robot.calibration.check.models import (
    CalibrationCheckSessionStatus,
    SessionCreateParams as CalCheckCreateParams,
)
from robot_server.robot.calibration.deck.models import DeckCalibrationSessionStatus
from robot_server.robot.calibration.models import SessionCreateParams
from robot_server.robot.calibration.pipette_offset.models import (
    PipetteOffsetCalibrationSessionStatus,
)
from robot_server.robot.calibration.tip_length.models import TipCalibrationSessionStatus
from robot_server.service.json_api import (
    RequestModel,
    DeprecatedResponseModel,
    ResponseDataModel,
    DeprecatedMultiResponseModel,
)
from robot_server.service.session.models.common import EmptyModel
from robot_server.service.session.session_types.protocol.models import (
    ProtocolCreateParams,
    ProtocolSessionDetails,
)


class SessionType(str, Enum):
    """The available session types"""

    calibration_check = "calibrationCheck"
    tip_length_calibration = "tipLengthCalibration"
    deck_calibration = "deckCalibration"
    pipette_offset_calibration = "pipetteOffsetCalibration"
    protocol = "protocol"
    live_protocol = "liveProtocol"


"""
A Union of all the create param types.
"""
SessionCreateParamType = typing.Union[
    SessionCreateParams,
    ProtocolCreateParams,
    BaseModel,
    None,
]

"""
A Union of all the possible session detail models.
"""
SessionDetails = typing.Union[
    CalibrationCheckSessionStatus,
    PipetteOffsetCalibrationSessionStatus,
    TipCalibrationSessionStatus,
    DeckCalibrationSessionStatus,
    ProtocolSessionDetails,
    EmptyModel,
]


class SessionCreateAttributes(BaseModel):
    """Attributes required for creating a session"""

    sessionType: SessionType = Field(..., description="The type of the session")


class SessionCreateAttributesNoParams(SessionCreateAttributes):
    """The base model of request that has no createParams."""

    createParams: typing.Optional[BaseModel]


class CalibrationCheckCreateAttributes(SessionCreateAttributesNoParams):
    """The calibration check create request."""

    sessionType: Literal[SessionType.calibration_check] = SessionType.calibration_check
    createParams: CalCheckCreateParams


class TipLengthCalibrationCreateAttributes(SessionCreateAttributes):
    """The tip length calibration create request."""

    sessionType: Literal[
        SessionType.tip_length_calibration
    ] = SessionType.tip_length_calibration
    createParams: SessionCreateParams


class DeckCalibrationCreateAttributes(SessionCreateAttributesNoParams):
    """The deck calibration create request."""

    sessionType: Literal[SessionType.deck_calibration] = SessionType.deck_calibration


class PipetteOffsetCalibrationCreateAttributes(SessionCreateAttributes):
    """Pipette offset calibration create request."""

    sessionType: Literal[
        SessionType.pipette_offset_calibration
    ] = SessionType.pipette_offset_calibration
    createParams: SessionCreateParams


class ProtocolCreateAttributes(SessionCreateAttributes):
    """Protocol session create request."""

    sessionType: Literal[SessionType.protocol] = SessionType.protocol
    createParams: ProtocolCreateParams


class LiveProtocolCreateAttributes(SessionCreateAttributesNoParams):
    """Live protocol session create request."""

    sessionType: Literal[SessionType.live_protocol] = SessionType.live_protocol


class SessionResponseAttributes(ResponseDataModel):
    """Common session response attributes."""

    createdAt: datetime = Field(
        ..., description="Date and time that this session was created"
    )
    details: BaseModel = Field(..., description="Detailed session specific status")


class CalibrationCheckResponseAttributes(
    CalibrationCheckCreateAttributes, SessionResponseAttributes
):
    """Response attributes of cal check session."""

    details: CalibrationCheckSessionStatus


class TipLengthCalibrationResponseAttributes(
    TipLengthCalibrationCreateAttributes, SessionResponseAttributes
):
    """Response attributes of tip length calibration session."""

    details: TipCalibrationSessionStatus


class DeckCalibrationResponseAttributes(
    DeckCalibrationCreateAttributes, SessionResponseAttributes
):
    """Response attributes of deck calibration session."""

    details: DeckCalibrationSessionStatus


class PipetteOffsetCalibrationResponseAttributes(
    PipetteOffsetCalibrationCreateAttributes, SessionResponseAttributes
):
    """Response attributes of pipette offset calibration session."""

    details: PipetteOffsetCalibrationSessionStatus


class ProtocolResponseAttributes(ProtocolCreateAttributes, SessionResponseAttributes):
    """Response attributes of protocol session."""

    details: ProtocolSessionDetails


class LiveProtocolResponseAttributes(
    LiveProtocolCreateAttributes, SessionResponseAttributes
):
    """Response attributes of live protocol session."""

    pass


RequestTypes = typing.Union[
    CalibrationCheckCreateAttributes,
    TipLengthCalibrationCreateAttributes,
    DeckCalibrationCreateAttributes,
    PipetteOffsetCalibrationCreateAttributes,
    ProtocolCreateAttributes,
    LiveProtocolCreateAttributes,
]


ResponseTypes = typing.Union[
    CalibrationCheckResponseAttributes,
    TipLengthCalibrationResponseAttributes,
    DeckCalibrationResponseAttributes,
    PipetteOffsetCalibrationResponseAttributes,
    ProtocolResponseAttributes,
    LiveProtocolResponseAttributes,
]


# Session create and query requests/responses
SessionCreateRequest = RequestModel[RequestTypes]
SessionResponse = DeprecatedResponseModel[ResponseTypes]
MultiSessionResponse = DeprecatedMultiResponseModel[ResponseTypes]
