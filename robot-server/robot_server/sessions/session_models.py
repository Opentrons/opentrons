"""Request and response models for session resources."""
from enum import Enum
from datetime import datetime
from pydantic import BaseModel, Field
from typing import List, Optional, Union
from typing_extensions import Literal

from robot_server.service.json_api import ResourceModel
from .session_inputs import SessionInput


class SessionType(str, Enum):
    """All available session types."""

    BASIC = "basic"


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
    inputs: List[SessionInput] = Field(
        ...,
        description="Client-initiated events for session control input.",
    )


class BasicSession(AbstractSession):
    """A session to execute commands without a previously loaded protocol file."""

    sessionType: Literal[SessionType.BASIC] = SessionType.BASIC


Session = Union[BasicSession]
