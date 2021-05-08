"""Sessions in-memory store."""
from datetime import datetime
from typing import List

from .session_models import Session, CreateSessionData


class SessionNotFoundError(ValueError):
    """Error raised when a given session ID is not found in the store."""

    def __init__(self, session_id: str) -> None:
        """Intialize the error message from the missing ID."""
        super().__init__(f"Session {session_id} was not found.")


class SessionStore:
    """Methods for storing and retrieving session resources."""

    def create_session(
        self,
        session_data: CreateSessionData,
        session_id: str,
        created_at: datetime,
    ) -> Session:
        """Create and store a new session resource.

        Arguments:
            session: Input data to create session from.
            session_id: Unique identifier.

        Returns:
            The created session.
        """
        raise NotImplementedError()

    def get_all_sessions(self) -> List[Session]:
        """Get all known session resources.

        Returns:
            All known sessions.
        """
        raise NotImplementedError()

    def get_session(self, session_id: str) -> Session:
        """Get a session by its unique identifier.

        Arguments:
            session_id: The session's unique identifier.

        Returns:
            The session resource.

        Raises:
            SessionNotFoundError: The specified session ID was not found.
        """
        raise NotImplementedError()

    def remove_session_by_id(self, session_id: str) -> Session:
        """Remove a session by its unique identifier.

        Arguments:
            session_id: The session's unique identifier.

        Returns:
            The session resource that was deleted.

        Raises:
            SessionNotFoundError: The specified session ID was not found.
        """
        raise NotImplementedError()
