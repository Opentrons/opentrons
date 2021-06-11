"""Sessions in-memory store."""
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List

from .session_models import SessionCreateData
from .action_models import SessionAction


@dataclass(frozen=True)
class SessionResource:
    """An entry in the session store, used to construct response models.

    This represents all session state that cannot be derived from another
    location, such as a ProtocolEngine instance.
    """

    session_id: str
    create_data: SessionCreateData
    created_at: datetime
    actions: List[SessionAction]


class SessionNotFoundError(ValueError):
    """Error raised when a given session ID is not found in the store."""

    def __init__(self, session_id: str) -> None:
        """Initialize the error message from the missing ID."""
        super().__init__(f"Session {session_id} was not found.")


class SessionStore:
    """Methods for storing and retrieving session resources."""

    def __init__(self) -> None:
        """Initialize a SessionStore and its in-memory storage."""
        self._sessions_by_id: Dict[str, SessionResource] = {}

    def upsert(self, session: SessionResource) -> SessionResource:
        """Insert or update a session resource in the store.

        Arguments:
            session: Session resource to store. Reads `session.id` to
                determine identity in storage.

        Returns:
            The resource that was added to the store.
        """
        self._sessions_by_id[session.session_id] = session

        return session

    def get(self, session_id: str) -> SessionResource:
        """Get a specific session entry by its identifier.

        Arguments:
            session_id: Unique identifier of session entry to retrieve.

        Returns:
            The retrieved session entry from the store.
        """
        try:
            return self._sessions_by_id[session_id]
        except KeyError as e:
            raise SessionNotFoundError(session_id) from e

    def get_all(self) -> List[SessionResource]:
        """Get all known session resources.

        Returns:
            All stored session entries.
        """
        return list(self._sessions_by_id.values())

    def remove(self, session_id: str) -> SessionResource:
        """Remove a session by its unique identifier.

        Arguments:
            session_id: The session's unique identifier.

        Returns:
            The session entry that was deleted.

        Raises:
            SessionNotFoundError: The specified session ID was not found.
        """
        try:
            return self._sessions_by_id.pop(session_id)
        except KeyError as e:
            raise SessionNotFoundError(session_id) from e
