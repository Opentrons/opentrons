from datetime import datetime
from enum import Enum

import typing

from pydantic import BaseModel, Field
from typing_extensions import Literal

from robot_server.robot.calibration.check.models import\
    CalibrationCheckSessionStatus
from robot_server.robot.calibration.deck.models import \
    DeckCalibrationSessionStatus
from robot_server.robot.calibration.models import SessionCreateParams
from robot_server.robot.calibration.pipette_offset.models import\
    PipetteOffsetCalibrationSessionStatus
from robot_server.robot.calibration.tip_length.models import\
    TipCalibrationSessionStatus
from robot_server.service.json_api import RequestModel, ResponseModel
from robot_server.service.json_api.response import MultiResponseModel
from robot_server.service.session.models.common import EmptyModel
from robot_server.service.session.session_types.protocol.models import \
    ProtocolCreateParams, ProtocolSessionDetails


class SessionType(str, Enum):
    """The available session types"""
    calibration_check = 'calibrationCheck'
    tip_length_calibration = 'tipLengthCalibration'
    deck_calibration = 'deckCalibration'
    pipette_offset_calibration = 'pipetteOffsetCalibration'
    protocol = 'protocol'
    live_protocol = 'liveProtocol'


"""
IMPORTANT: Models in this Union should be sorted by specificity. If model A
has `name`, `type` attributes and model B has just `name`, then model A must
come first.

Read more here: https://pydantic-docs.helpmanual.io/usage/types/#unions

When we move to Python 3.8 we can use Literal type as described here
https://pydantic-docs.helpmanual.io/usage/types/#literal-type
"""
SessionCreateParamType = typing.Union[
    SessionCreateParams,
    ProtocolCreateParams,
    None,
    BaseModel
]

"""
IMPORTANT: See note for SessionCreateParamType

Read more here: https://pydantic-docs.helpmanual.io/usage/types/#unions
"""
SessionDetails = typing.Union[
    CalibrationCheckSessionStatus,
    PipetteOffsetCalibrationSessionStatus,
    TipCalibrationSessionStatus,
    DeckCalibrationSessionStatus,
    ProtocolSessionDetails,
    EmptyModel
]


class SessionCreateAttributes(BaseModel):
    """Attributes required for creating a session"""
    sessionType: SessionType =\
        Field(...,
              description="The type of the session")


class SessionCreateAttributesNoParams(SessionCreateAttributes):
    createParams: typing.Optional[BaseModel]


class NullSessionCreateAttributes(SessionCreateAttributesNoParams):
    sessionType: Literal[SessionType.null] = SessionType.null


class DefaultSessionCreateAttributes(SessionCreateAttributesNoParams):
    sessionType: Literal[SessionType.default] = SessionType.default


class CalibrationCheckCreateAttributes(SessionCreateAttributesNoParams):
    sessionType: Literal[SessionType.calibration_check] = SessionType.calibration_check


class TipLengthCalibrationCreateAttributes(SessionCreateAttributes):
    sessionType: Literal[SessionType.tip_length_calibration] = SessionType.tip_length_calibration
    createParams: SessionCreateParams


class DeckCalibrationCreateAttributes(SessionCreateAttributesNoParams):
    sessionType: Literal[SessionType.deck_calibration] = SessionType.deck_calibration


class PipetteOffsetCalibrationCreateAttributes(SessionCreateAttributes):
    sessionType: Literal[SessionType.pipette_offset_calibration] = SessionType.pipette_offset_calibration
    createParams: SessionCreateParams


class ProtocolCreateAttributes(SessionCreateAttributes):
    sessionType: Literal[SessionType.protocol] = SessionType.protocol
    createParams: ProtocolCreateParams


class LiveProtocolCreateAttributes(SessionCreateAttributesNoParams):
    sessionType: Literal[SessionType.live_protocol] = SessionType.live_protocol


class SessionResponseAttributes(BaseModel):
    createdAt: datetime = \
        Field(...,
              description="Date and time that this session was created")
    details: BaseModel =\
        Field(...,
              description="Detailed session specific status")


class NullSessionResponseAttributes(NullSessionCreateAttributes,
                                    SessionResponseAttributes):
    pass


class DefaultSessionResponseAttributes(DefaultSessionCreateAttributes,
                                       SessionResponseAttributes):
    pass


class CalibrationCheckResponseAttributes(CalibrationCheckCreateAttributes,
                                         SessionResponseAttributes):
    details: CalibrationCheckSessionStatus


class TipLengthCalibrationResponseAttributes(TipLengthCalibrationCreateAttributes,
                                             SessionResponseAttributes):
    details: TipCalibrationSessionStatus


class DeckCalibrationResponseAttributes(DeckCalibrationCreateAttributes,
                                        SessionResponseAttributes):
    details: DeckCalibrationSessionStatus


class PipetteOffsetCalibrationResponseAttributes(PipetteOffsetCalibrationCreateAttributes,
                                                 SessionResponseAttributes):
    details: PipetteOffsetCalibrationSessionStatus


class ProtocolResponseAttributes(ProtocolCreateAttributes,
                                 SessionResponseAttributes):
    details: ProtocolSessionDetails


class LiveProtocolResponseAttributes(LiveProtocolCreateAttributes,
                                     SessionResponseAttributes):
    pass


RequestTypes = typing.Union[
    NullSessionCreateAttributes, DefaultSessionCreateAttributes,
    CalibrationCheckCreateAttributes, TipLengthCalibrationCreateAttributes,
    DeckCalibrationCreateAttributes, PipetteOffsetCalibrationCreateAttributes,
    ProtocolCreateAttributes, LiveProtocolCreateAttributes]


ResponseTypes = typing.Union[
    NullSessionResponseAttributes, DefaultSessionResponseAttributes,
    CalibrationCheckResponseAttributes, TipLengthCalibrationResponseAttributes,
    DeckCalibrationResponseAttributes, PipetteOffsetCalibrationResponseAttributes,
    ProtocolResponseAttributes, LiveProtocolResponseAttributes]


# Session create and query requests/responses
SessionCreateRequest = RequestModel[
    RequestTypes
]
SessionResponse = ResponseModel[
    ResponseTypes, dict
]
MultiSessionResponse = MultiResponseModel[
    ResponseTypes, dict
]
