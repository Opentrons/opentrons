from datetime import datetime
from enum import Enum

import typing

from pydantic import BaseModel, Field, validator

from robot_server.robot.calibration.check.models import CalibrationSessionStatus
from robot_server.robot.calibration.deck.models import \
    DeckCalibrationSessionStatus
from robot_server.robot.calibration.pipette_offset.models import \
    SessionCreateParams as PipetteOffsetSessionCreateParams, \
    PipetteOffsetCalibrationSessionStatus
from robot_server.robot.calibration.tip_length.models import (
    SessionCreateParams as TipLengthSessionCreateParams,
    TipCalibrationSessionStatus)
from robot_server.service.json_api import RequestModel, RequestDataModel, \
    ResponseModel, ResponseDataModel
from robot_server.service.session.session_models.common import EmptyModel
from robot_server.service.session.session_types.protocol.models import \
    ProtocolCreateParams, ProtocolSessionDetails


class SessionType(str, Enum):
    """The available session types"""
    def __new__(cls, value, create_param_model=None):
        """Create a session type enum with the optional create param model

        IMPORTANT: Model definition must appear in SessionCreateParamType
        Union below.
        """
        # Ignoring type errors because this is exactly as described here
        # https://docs.python.org/3/library/enum.html#when-to-use-new-vs-init
        obj = str.__new__(cls, value)  # type: ignore
        obj._value_ = value
        obj._model = create_param_model
        return obj

    null = 'null'
    default = 'default'
    calibration_check = 'calibrationCheck'
    tip_length_calibration = (
        'tipLengthCalibration',
        TipLengthSessionCreateParams
    )
    deck_calibration = 'deckCalibration'
    pipette_offset_calibration = (
        'pipetteOffsetCalibration',
        PipetteOffsetSessionCreateParams
    )
    protocol = ('protocol', ProtocolCreateParams)

    @property
    def model(self):
        """Get the data model of the create param model"""
        return self._model  # type: ignore


"""
IMPORTANT: Models in this Union should be sorted by specificity. If model A
has `name`, `type` attributes and model B has just `name`, then model A must
come first.

Read more here: https://pydantic-docs.helpmanual.io/usage/types/#unions

When we move to Python 3.8 we can use Literal type as described here
https://pydantic-docs.helpmanual.io/usage/types/#literal-type
"""
SessionCreateParamType = typing.Union[
    TipLengthSessionCreateParams,
    PipetteOffsetSessionCreateParams,
    ProtocolCreateParams,
    None,
    EmptyModel
]

"""
IMPORTANT: See note for SessionCreateParamType

Read more here: https://pydantic-docs.helpmanual.io/usage/types/#unions
"""
SessionDetails = typing.Union[
    CalibrationSessionStatus,
    TipCalibrationSessionStatus,
    DeckCalibrationSessionStatus,
    PipetteOffsetCalibrationSessionStatus,
    ProtocolSessionDetails,
    EmptyModel
]


class BasicSession(BaseModel):
    """Attributes required for creating a session"""
    createParams: SessionCreateParamType
    # For validation, sessionType MUST appear after createParams
    sessionType: SessionType =\
        Field(...,
              description="The type of the session")

    @validator('sessionType', always=True, allow_reuse=True)
    def check_data_type(cls, v, values):
        """Validate that the session type and create params model match"""
        create_params = values.get('createParams')
        if v.model is None:
            # If model is None then we will accept either None or an
            # EmptyModel (ie "{}")
            is_valid_type = create_params is None or\
                            isinstance(create_params, EmptyModel)
        else:
            is_valid_type = isinstance(create_params, v.model)

        if not is_valid_type:
            raise ValueError(f"Invalid create param for session type {v}. "
                             f"Expecting {v.model}")
        return v


class Session(BasicSession):
    """The attributes of a created session"""
    details: SessionDetails =\
        Field(...,
              description="Detailed session specific status")
    createdAt: datetime = \
        Field(...,
              description="Date and time that this session was created")


# Session create and query requests/responses
SessionCreateRequest = RequestModel[
    RequestDataModel[BasicSession]
]
SessionResponse = ResponseModel[
    ResponseDataModel[Session], dict
]
MultiSessionResponse = ResponseModel[
    typing.List[ResponseDataModel[Session]], dict
]
