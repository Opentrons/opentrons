import logging
from typing import Optional, Tuple, Dict, Type

from opentrons.calibration.check.models import SessionType
from opentrons.hardware_control import ThreadManager

from robot_server.service.session.errors import SessionCreationException
from robot_server.service.session.session_types.base_session import BaseSession
from robot_server.service.session.configuration import SessionConfiguration
from robot_server.service.session.models import IdentifierType
from robot_server.service.session.session_types import NullSession, \
    CheckSession, SessionMetaData

log = logging.getLogger(__name__)

SessionTypeToClass: Dict[SessionType, Type[BaseSession]] = {
    SessionType.null: NullSession,
    SessionType.calibration_check: CheckSession,
}


class SessionManager:
    """Manager of session instances"""

    def __init__(self, hardware: ThreadManager):
        self._sessions: Dict[IdentifierType, BaseSession] = {}
        self._active_session_id: Optional[IdentifierType] = None
        # Create object supplied to all sessions
        self._session_common = SessionConfiguration(
            hardware=hardware,
            is_active=self.is_active
        )

    async def add(self, session_type: SessionType) -> BaseSession:
        """Add a new session"""
        cls = SessionTypeToClass.get(session_type)
        if not cls:
            raise SessionCreationException(
                f"'{session_type}' is not supported"
            )
        session = await cls.create(configuration=self._session_common,
                                   instance_meta=SessionMetaData())
        self._active_session_id = session.meta.identifier
        self._sessions[session.meta.identifier] = session
        return session

    async def remove(self, identifier: IdentifierType) \
            -> Optional[BaseSession]:
        """Remove a session"""
        session = self.deactivate(identifier)
        if session:
            del self._sessions[session.meta.identifier]
            await session.clean_up()
        return session

    def get_by_id(self, identifier: IdentifierType) \
            -> Optional[BaseSession]:
        """Get a session by identifier"""
        return self._sessions.get(identifier, None)

    def get(self, session_type: SessionType = None) -> Tuple[BaseSession, ...]:
        """
        Get all the sessions with optional filter

        :param session_type: Optional session type filter
        """
        return tuple(session for session in self._sessions.values()
                     if not session_type
                     or session.session_type == session_type)

    def get_active(self) -> Optional[BaseSession]:
        """Get the active session"""
        return self.get_by_id(self._active_session_id) if \
            self._active_session_id else None

    def is_active(self, identifier: IdentifierType) -> bool:
        """Check if session identifier is active"""
        return identifier == self._active_session_id

    def activate(self, identifier: IdentifierType) -> Optional[BaseSession]:
        """Activate a session"""
        session = self.get_by_id(identifier)
        if session:
            self._active_session_id = identifier
        return session

    def deactivate(self, identifier: IdentifierType) \
            -> Optional[BaseSession]:
        """Deactivate a session"""
        if identifier == self._active_session_id:
            self._active_session_id = None
        return self.get_by_id(identifier)
