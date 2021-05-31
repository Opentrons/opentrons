"""Session response model factory."""
from dataclasses import replace
from datetime import datetime
from typing import Optional, Tuple

from .session_store import SessionResource
from .control_commands import SessionControlCommand, SessionControlCommandCreateData
from .session_models import (
    Session,
    BasicSession,
    SessionCreateData,
    BasicSessionCreateData,
)


class SessionBuilder:
    """Interface to construct session resource models from data."""

    @staticmethod
    def create(
        session_id: str,
        created_at: datetime,
        create_data: Optional[SessionCreateData],
    ) -> SessionResource:
        """Create a new session resource.

        Arguments:
            session_id: Unique identifier.
            created_at: Resource creation timestamp.
            create_data: Data used to create the session.

        Returns:
            The created session entry in the store.
        """
        return SessionResource(
            session_id=session_id,
            created_at=created_at,
            create_data=create_data or BasicSessionCreateData(),
            control_commands=[],
        )

    @staticmethod
    def create_control_command(
        session: SessionResource,
        control_command_id: str,
        control_command_data: SessionControlCommandCreateData,
        created_at: datetime,
    ) -> Tuple[SessionControlCommand, SessionResource]:
        """Create a new session control command resource.

        Arguments:
            seesion: The session resource to add the command to.
            control_command_id: Unique ID to assign to the command resource.
            control_command_data: Data used to create the command resource.
            created_at: Resource creation timestamp.

        Returns:
            A tuple of the created SessionControlCommand resource and the
            updated SessionResource.

        """
        control_command = SessionControlCommand(
            id=control_command_id,
            createdAt=created_at,
            controlType=control_command_data.controlType,
        )

        updated_session = replace(
            session,
            control_commands=session.control_commands + [control_command],
        )

        return control_command, updated_session

    @staticmethod
    def to_response(session: SessionResource) -> Session:
        """Build a session resource model.

        Arguments:
            entry: Stored session data from the SessionStore.

        Returns:
            Session model representing the resource.
        """
        create_data = session.create_data

        if isinstance(create_data, BasicSessionCreateData):
            return BasicSession.construct(
                id=session.session_id,
                createdAt=session.created_at,
                controlCommands=session.control_commands,
            )

        raise ValueError(f"Invalid session store entry {session}")
