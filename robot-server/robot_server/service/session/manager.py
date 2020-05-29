import logging
from typing import Optional, Tuple, Dict, Type

from opentrons.calibration.check.models import SessionType
from opentrons.hardware_control import HardwareAPILike

from robot_server.service.session.session import Session
from robot_server.service.session.common import SessionCommon
from robot_server.service.session.models import IdentifierType


log = logging.getLogger(__name__)

SessionTypeToClass: Dict[SessionType, Type[Session]] = {
    SessionType.null: Session,
    # SessionType.default:
}


class SessionManager:
    """Manager of session instances"""

    def __init__(self, hardware: HardwareAPILike):
        self._sessions: Dict[IdentifierType, Session] = {}
        self._active_session_id: Optional[IdentifierType] = None
        # Create object supplied to all sessions
        self._session_common = SessionCommon(
            hardware=hardware,
            is_active=self.is_active
        )

    def add(self, session_type: SessionType) -> Optional[Session]:
        """Add a new session"""
        session = None
        cls = SessionTypeToClass.get(session_type)
        if cls:
            session = cls.create(self._session_common)
            if session:
                self._sessions[session.identifier] = session
        return session

    def remove(self, identifier: IdentifierType) -> Optional[Session]:
        """Remove a session"""
        session = self.deactivate(identifier)
        if session:
            del self._sessions[session.identifier]
            session.clean_up()
        return session

    def get_by_id(self, identifier: IdentifierType) \
            -> Optional[Session]:
        """Get a session by identifier"""
        return self._sessions.get(identifier, None)

    def get_by_type(self, session_type: SessionType) -> Tuple[Session, ...]:
        """Get sessions by type"""
        return tuple(session for session in self._sessions.values()
                     if session.session_type == session_type)

    def get_active(self) -> Optional[Session]:
        """Get the active session"""
        return self.get_by_id(self._active_session_id) if \
            self._active_session_id else None

    def is_active(self, identifier: IdentifierType) -> bool:
        """Check if session identifier is active"""
        return identifier == self._active_session_id

    def activate(self, identifier: IdentifierType) -> Optional[Session]:
        """Activate a session"""
        session = self.get_by_id(identifier)
        if session:
            self._active_session_id = identifier
        return session

    def deactivate(self, identifier: IdentifierType) \
            -> Optional[Session]:
        """Deactivate a session"""
        if identifier == self._active_session_id:
            self._active_session_id = None
        return self.get_by_id(identifier)
