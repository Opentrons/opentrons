"""Sessions in-memory store."""
from typing import Dict, List

from .engine_store import EngineStore, EngineNotFoundError
from .command_models import SessionCommand
from .session_models import Session, CreateSessionData
from .session_type import SessionType


class SessionNotFoundError(ValueError):
    """Error raised when a given session ID is not found in the store."""

    def __init__(self, session_id: str) -> None:
        """Intialize the error message from the missing ID."""
        super().__init__(f"Session {session_id} was not found.")


class SessionStore:
    """Methods for storing and retrieving session resources."""

    def __init__(self, engine_store: EngineStore) -> None:
        """Initialize the SessionStore with its dependencies."""
        self._engine_store = engine_store
        self._session_type_by_id: Dict[str, SessionType] = {}

    def create_session(
        self,
        session_data: CreateSessionData,
        session_id: str,
    ) -> Session:
        """Create and store a new session resource.

        Arguments:
            session: Input data to create session from.
            session_id: Unique identifier.

        Returns:
            The created session.
        """
        session_type = session_data.sessionType
        self._session_type_by_id[session_id] = session_type
        return Session(id=session_id, sessionType=session_type, commands=[])

    def get_all_sessions(self) -> List[Session]:
        """Get all known session resources.

        Returns:
            All known sessions.
        """
        return [
            self.get_session(session_id)
            for session_id in self._session_type_by_id.keys()
        ]

    def get_session(self, session_id: str) -> Session:
        """Get a session by its unique identifier.

        Arguments:
            session_id: The session's unique identifier.

        Returns:
            The session resource.

        Raises:
            SessionNotFoundError: The specified session ID was not found.
        """
        try:
            session_type = self._session_type_by_id[session_id]
        except KeyError as e:
            raise SessionNotFoundError(session_id) from e

        try:
            commands = self._engine_store.get_state(
                session_id
            ).commands.get_all_command_ids()
        except EngineNotFoundError:
            commands = []

        return Session(id=session_id, sessionType=session_type, commands=commands)

    def get_session_commands(self, session_id: str) -> List[SessionCommand]:
        """Get a session's commands by the session's unique identifier.

        Arguments:
            session_id: The session's unique identifier.

        Returns:
            The command resources.

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
