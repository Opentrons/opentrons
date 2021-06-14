"""Request and response models for session resources."""
from enum import Enum
from datetime import datetime
from pydantic import BaseModel, Field
from typing import List, Optional, Union
from typing_extensions import Literal

from robot_server.service.json_api import ResourceModel
from .action_models import SessionAction


class SessionType(str, Enum):
    """All available session types."""

    BASIC = "basic"
    PROTOCOL = "protocol"


class AbstractSessionCreateData(BaseModel):
    """Request data sent when creating a session."""

    sessionType: SessionType = Field(
        ...,
        description="The session type to create.",
    )
    createParams: Optional[BaseModel] = Field(
        None,
        description="Parameters to set session behaviors at creation time.",
    )


class AbstractSession(ResourceModel):
    """Base session resource model."""

    id: str = Field(..., description="Unique session identifier.")
    sessionType: SessionType = Field(..., description="Specific session type.")
    createdAt: datetime = Field(..., description="When the session was created")
    # TODO(mc, 2021-05-25): how hard would it be to rename this field to `config`?
    createParams: Optional[BaseModel] = Field(
        None,
        description="Configuration parameters for the session.",
    )
    actions: List[SessionAction] = Field(
        ...,
        description="Client-initiated commands for session control.",
    )


class BasicSessionCreateData(AbstractSessionCreateData):
    """Creation request data for a basic session."""

    sessionType: Literal[SessionType.BASIC] = SessionType.BASIC


class BasicSession(AbstractSession):
    """A session to execute commands without a previously loaded protocol file."""

    sessionType: Literal[SessionType.BASIC] = SessionType.BASIC


class ProtocolSessionCreateParams(BaseModel):
    """Creation parameters for a protocol session."""

    protocolId: str = Field(
        ...,
        description="Unique identifier of the protocol this session will run.",
    )


class ProtocolSessionCreateData(AbstractSessionCreateData):
    """Creation request data for a protocol session."""

    sessionType: Literal[SessionType.PROTOCOL] = SessionType.PROTOCOL
    createParams: ProtocolSessionCreateParams


class ProtocolSession(AbstractSession):
    """A session to execute commands with a previously loaded protocol file."""

    sessionType: Literal[SessionType.PROTOCOL] = SessionType.PROTOCOL
    createParams: ProtocolSessionCreateParams


SessionCreateData = Union[
    BasicSessionCreateData,
    ProtocolSessionCreateData,
]

Session = Union[
    BasicSession,
    ProtocolSession,
]
