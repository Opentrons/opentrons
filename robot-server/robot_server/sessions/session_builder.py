"""Session model factory interface and types."""
from datetime import datetime
from pydantic import BaseModel, Field
from typing import List, Optional, Union
from typing_extensions import Literal

from .session_inputs import SessionInput
from .session_models import SessionType, Session


class AbstractCreateSessionData(BaseModel):
    """Request data sent when creating a session."""

    sessionType: SessionType = Field(
        ...,
        description="The session type to create.",
    )
    createParams: Optional[BaseModel] = Field(
        None,
        description="Parameters to set session behaviors at creation time.",
    )


class CreateBasicSessionData(AbstractCreateSessionData):
    """Creation request data for a basic session."""

    sessionType: Literal[SessionType.BASIC] = SessionType.BASIC


CreateSessionData = Union[CreateBasicSessionData]


class SessionBuilder:
    """Interface to construct session resources."""

    @staticmethod
    def build(
        session_id: str,
        session_data: Optional[CreateSessionData],
        created_at: datetime,
        inputs: List[SessionInput],
    ) -> Session:
        """Build a session resource model.

        Arguments:
            session_id: Unique identifier of the session resource.
            session_data: Data used to when the resource was created.
            created_at: Resource creation timestamp.

        Returns:
            Session model representing the resource.
        """
        raise NotImplementedError()
