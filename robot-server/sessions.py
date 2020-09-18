from datetime import datetime
from typing import Optional, Union, TypeVar, Generic, List

from pydantic.generics import GenericModel
from typing_extensions import Literal
from enum import Enum

from pydantic import BaseModel, Field


from robot_server.robot.calibration.check.models import \
    CalibrationSessionStatus
from robot_server.robot.calibration.deck.models import \
    DeckCalibrationSessionStatus
from robot_server.robot.calibration.tip_length.models import (
    SessionCreateParams as TipLengthCreateParams, TipCalibrationSessionStatus)
from robot_server.robot.calibration.pipette_offset.models import (
    SessionCreateParams as PipeteOffsetCreateParams,
    PipetteOffsetCalibrationSessionStatus)
from robot_server.service.json_api import RequestModel, RequestDataModel, \
    ResponseModel, ResponseDataModel
from robot_server.service.session.session_types.protocol.models import (
    ProtocolCreateParams, ProtocolSessionDetails)


class SessionType(str, Enum):
    """The available session types"""
    null = 'null'
    default = 'default'
    calibration_check = 'calibrationCheck'
    tip_length_calibration = 'tipLengthCalibration'
    deck_calibration = 'deckCalibration'
    pipette_offset_calibration = 'pipetteOffsetCalibration'
    protocol = 'protocol'


class SessionCreateAttributes(BaseModel):
    """Attributes required for creating a session"""
    sessionType: SessionType =\
        Field(...,
              description="The type of the session")


class SessionCreateAttributesNoParams(SessionCreateAttributes):
    createParams = Optional[BaseModel]


class NullSessionCreateAttributes(SessionCreateAttributesNoParams):
    sessionType = Literal[SessionType.null]


class DefaultSessionCreateAttributes(SessionCreateAttributesNoParams):
    sessionType = Literal[SessionType.default]


class CalibrationCheckCreateAttributes(SessionCreateAttributesNoParams):
    sessionType = Literal[SessionType.calibration_check]


class TipLengthCalibrationCreateAttributes(SessionCreateAttributes):
    sessionType = Literal[SessionType.tip_length_calibration]
    createParams = TipLengthCreateParams


class DeckCalibrationCreateAttributes(SessionCreateAttributesNoParams):
    sessionType = Literal[SessionType.deck_calibration]


class PipetteOffsetCalibrationCreateAttributes(SessionCreateAttributes):
    sessionType = Literal[SessionType.pipette_offset_calibration]
    createParams = PipeteOffsetCreateParams


class ProtocolCreateAttributes(SessionCreateAttributes):
    sessionType = Literal[SessionType.protocol]
    createParams = ProtocolCreateParams


CreateParamType = Union[
    TipLengthCreateParams,
    PipeteOffsetCreateParams,
    ProtocolCreateParams,
    BaseModel,
    None
]


SessionDetailsT = TypeVar('SessionDetailsT', bound=BaseModel)


class SessionResponseAttributes(GenericModel, Generic[SessionDetailsT]):
    """The attributes of a created session"""
    details: SessionDetailsT =\
        Field(...,
              description="Detailed session specific status")
    createdAt: datetime = \
        Field(...,
              description="Date and time that this session was created")


class NullSessionResponseAttributes(NullSessionCreateAttributes,
                                    SessionResponseAttributes[BaseModel]):
    pass


class DefaultSessionResponseAttributes(DefaultSessionCreateAttributes,
                                       SessionResponseAttributes[BaseModel]):
    pass


class CalibrationCheckResponseAttributes(CalibrationCheckCreateAttributes,
                                         SessionResponseAttributes[CalibrationSessionStatus]):
    pass


class TipLengthCalibrationResponseAttributes(TipLengthCalibrationCreateAttributes,
                                             SessionResponseAttributes[TipCalibrationSessionStatus]):
    pass


class DeckCalibrationResponseAttributes(DeckCalibrationCreateAttributes,
                                        SessionResponseAttributes[DeckCalibrationSessionStatus]):
    pass


class PipetteOffsetCalibrationResponseAttributes(PipetteOffsetCalibrationCreateAttributes,
                                                 SessionResponseAttributes[PipetteOffsetCalibrationSessionStatus]):
    pass


class ProtocolResponseAttributes(ProtocolCreateAttributes,
                                 SessionResponseAttributes[ProtocolSessionDetails]):
    pass


A = Union[
    NullSessionCreateAttributes,
    DefaultSessionCreateAttributes,
    CalibrationCheckCreateAttributes,
    TipLengthCalibrationCreateAttributes,
    DeckCalibrationCreateAttributes,
    PipetteOffsetCalibrationCreateAttributes,
    ProtocolCreateAttributes
]

AA = RequestModel[A]


SessionCreateType = Union[
    RequestModel[NullSessionCreateAttributes],
    RequestModel[DefaultSessionCreateAttributes],
    RequestModel[CalibrationCheckCreateAttributes],
    RequestModel[TipLengthCalibrationCreateAttributes],
    RequestModel[DeckCalibrationCreateAttributes],
    RequestModel[PipetteOffsetCalibrationCreateAttributes],
    RequestModel[ProtocolCreateAttributes]
]


SessionResponseType = Union[
    ResponseModel[NullSessionResponseAttributes, dict],
    ResponseModel[DefaultSessionResponseAttributes, dict],
    ResponseModel[CalibrationCheckResponseAttributes, dict],
    ResponseModel[TipLengthCalibrationResponseAttributes, dict],
    ResponseModel[DeckCalibrationResponseAttributes, dict],
    ResponseModel[PipetteOffsetCalibrationResponseAttributes, dict],
    ResponseModel[ProtocolResponseAttributes, dict]
]

MultiSessionResponse = ResponseModel[List[SessionResponseType], dict]
