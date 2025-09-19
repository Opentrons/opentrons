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
    DeprecatedResponseDataModel,
    DeprecatedMultiResponseModel,
)


class SessionType(str, Enum):
    """The available session types"""

    calibration_check = "calibrationCheck"
    tip_length_calibration = "tipLengthCalibration"
    deck_calibration = "deckCalibration"
    pipette_offset_calibration = "pipetteOffsetCalibration"


"""
A Union of all the create param types.
"""
SessionCreateParamType = typing.Union[
    SessionCreateParams,
    BaseModel,
    None,
]


class CalibrationCheckCreateAttributes(BaseModel):
    """The calibration check create request."""

    sessionType: Literal[SessionType.calibration_check] = SessionType.calibration_check
    createParams: CalCheckCreateParams


class TipLengthCalibrationCreateAttributes(BaseModel):
    """The tip length calibration create request."""

    sessionType: Literal[
        SessionType.tip_length_calibration
    ] = SessionType.tip_length_calibration
    createParams: SessionCreateParams


class _NoParams(BaseModel):
    ...


class DeckCalibrationCreateAttributes(BaseModel):
    """The deck calibration create request."""

    sessionType: Literal[SessionType.deck_calibration] = SessionType.deck_calibration
    createParams: None | _NoParams = None


class PipetteOffsetCalibrationCreateAttributes(BaseModel):
    """Pipette offset calibration create request."""

    sessionType: Literal[
        SessionType.pipette_offset_calibration
    ] = SessionType.pipette_offset_calibration
    createParams: SessionCreateParams


class SessionResponseAttributes(DeprecatedResponseDataModel):
    """Common session response attributes."""

    createdAt: datetime = Field(
        ..., description="Date and time that this session was created"
    )


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


RequestTypes = typing.Union[
    CalibrationCheckCreateAttributes,
    TipLengthCalibrationCreateAttributes,
    DeckCalibrationCreateAttributes,
    PipetteOffsetCalibrationCreateAttributes,
]


ResponseTypes = typing.Union[
    CalibrationCheckResponseAttributes,
    TipLengthCalibrationResponseAttributes,
    DeckCalibrationResponseAttributes,
    PipetteOffsetCalibrationResponseAttributes,
]


# Session create and query requests/responses
SessionCreateRequest = RequestModel[RequestTypes]
SessionResponse = DeprecatedResponseModel[ResponseTypes]
MultiSessionResponse = DeprecatedMultiResponseModel[ResponseTypes]
