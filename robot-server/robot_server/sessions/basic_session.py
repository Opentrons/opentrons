"""Basic session type.

Can be used to execute commands, but provides no additional state
management or logic. Useful for basic, one-off commands or live
protocol execution via individual HTTP commands.
"""
from pydantic import Field
from typing_extensions import Literal

from .session_type import SessionType
from .session_models import Session


class BasicSession(Session):
    """Basic session resource model."""

    id: str = Field(..., description="Unique session identifier.")
    sessionType: Literal[SessionType.BASIC] = Field(
        SessionType.BASIC,
        description="Session type identifier.",
    )
