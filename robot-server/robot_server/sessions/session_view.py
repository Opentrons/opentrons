"""Session response model factory."""
from dataclasses import replace
from datetime import datetime
from typing import List, Optional, Tuple

from opentrons.protocol_engine import Command as ProtocolEngineCommand, EngineStatus
from .session_store import SessionResource
from .action_models import SessionAction, SessionActionCreateData
from .session_models import (
    Session,
    SessionCreateData,
    BasicSession,
    BasicSessionCreateData,
    ProtocolSession,
    ProtocolSessionCreateData,
    SessionCommandSummary,
)


class SessionView:
    """Interface to build session model instances from data.

    Resources consumed and returned by this class will be treated as
    immutable.
    """

    @staticmethod
    def as_resource(
        session_id: str,
        created_at: datetime,
        create_data: Optional[SessionCreateData],
    ) -> SessionResource:
        """Create a new session resource instance from its create data.

        Arguments:
            session_id: Unique identifier.
            created_at: Resource creation timestamp.
            create_data: Data used to create the session.

        Returns:
            The session in its internal resource representation, for use in
                the `SessionStore` and other classes.
        """
        return SessionResource(
            session_id=session_id,
            created_at=created_at,
            create_data=create_data or BasicSessionCreateData(),
            actions=[],
        )

    @staticmethod
    def with_action(
        session: SessionResource,
        action_id: str,
        action_data: SessionActionCreateData,
        created_at: datetime,
    ) -> Tuple[SessionAction, SessionResource]:
        """Create a new session control action resource instance.

        Arguments:
            session: The session resource to add the command to.
            action_id: Unique ID to assign to the command resource.
            action_data: Data used to create the command resource.
            created_at: Resource creation timestamp.

        Returns:
            A tuple of the created SessionAction resource and an
            updated copy of the passed in SessionResource.

        """
        actions = SessionAction(
            id=action_id,
            createdAt=created_at,
            actionType=action_data.actionType,
        )

        updated_session = replace(
            session,
            actions=session.actions + [actions],
        )

        return actions, updated_session

    @staticmethod
    def as_response(
        session: SessionResource,
        commands: List[ProtocolEngineCommand],
        engine_status: EngineStatus,
    ) -> Session:
        """Transform a session resource into its public response model.

        Arguments:
            session: Internal resource representation of the session.

        Returns:
            Session response model representing the same resource.
        """
        create_data = session.create_data
        command_summaries = [
            SessionCommandSummary(id=c.id, commandType=c.commandType, status=c.status)
            for c in commands
        ]

        if isinstance(create_data, BasicSessionCreateData):
            return BasicSession.construct(
                id=session.session_id,
                createdAt=session.created_at,
                actions=session.actions,
                commands=command_summaries,
                status=engine_status,
            )
        if isinstance(create_data, ProtocolSessionCreateData):
            return ProtocolSession.construct(
                id=session.session_id,
                createdAt=session.created_at,
                createParams=create_data.createParams,
                actions=session.actions,
                commands=command_summaries,
                status=engine_status,
            )

        raise ValueError(f"Invalid session resource {session}")
