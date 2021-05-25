"""Sessions in-memory store."""
from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional

from .session_builder import CreateSessionData
from .session_inputs import SessionInput, CreateSessionInputData


@dataclass(frozen=True)
class SessionStoreEntry:
    """An entry in the session store, used to construct response models."""

    session_id: str
    session_data: Optional[CreateSessionData]
    created_at: datetime
    inputs: List[SessionInput]


class SessionNotFoundError(ValueError):
    """Error raised when a given session ID is not found in the store."""

    def __init__(self, session_id: str) -> None:
        """Intialize the error message from the missing ID."""
        super().__init__(f"Session {session_id} was not found.")


class SessionStore:
    """Methods for storing and retrieving session resources."""

    def create(
        self,
        session_id: str,
        session_data: Optional[CreateSessionData],
        created_at: datetime,
    ) -> SessionStoreEntry:
        """Create and store a new session resource.

        Arguments:
            session_id: Unique identifier.
            session_data: Data used to create the session.
            created_at: Resource creation timestampe

        Returns:
            The created session entry in the store.
        """
        raise NotImplementedError()

    def get(self, session_id: str) -> SessionStoreEntry:
        """Get a specific session entry by its identifier.

        Arguments:
            session_id: Unique identifier of session entry to retrieve.

        Returns:
            The retrieved session entry from the store.
        """
        raise NotImplementedError()

    def get_all(self) -> List[SessionStoreEntry]:
        """Get all known session resources.

        Returns:
            All stored session entries.
        """
        raise NotImplementedError()

    def remove(self, session_id: str) -> SessionStoreEntry:
        """Remove a session by its unique identifier.

        Arguments:
            session_id: The session's unique identifier.

        Returns:
            The session entry that was deleted.

        Raises:
            SessionNotFoundError: The specified session ID was not found.
        """
        raise NotImplementedError()

    def create_input(
        self,
        session_id: str,
        input_id: str,
        input_data: CreateSessionInputData,
        created_at: datetime,
    ) -> SessionInput:
        """Create a session input resource and add it to the store.

        Arguments:
            session_id: The session to add the input to.
            input_id: Unique ID to assign to the input resource.
            input_data: Data used to create the input resource.
            created_at: Resource creation timestamp.

        Returns:
            The created input resource.

        Raises:
            SessionNotFoundError: The specified session ID was not found.
        """
        raise NotImplementedError()
