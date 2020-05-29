from typing import Optional, Iterable

from opentrons.calibration.check.models import SessionType

from robot_server.service.session.session import Session, \
    SessionIdentifierType


class SessionManager:
    def __init__(self):
        pass

    def create(self, session_type: SessionType) -> Session:
        """Create a session"""
        pass

    def get_by_id(self, identifier: SessionIdentifierType) \
            -> Optional[Session]:
        """Get a session by identifier"""
        pass

    def get_by_type(self, session_type: SessionType) -> Iterable[Session]:
        """Get sessions by type"""
        pass

    def get_active(self) -> Optional[Session]:
        """Get the active session"""
        pass

    def remove(self, identifier: SessionIdentifierType) -> Optional[Session]:
        """Remove a session"""
        pass

    def activate(self, identifier: SessionIdentifierType) -> Optional[Session]:
        """Activate a session"""
        pass

    def deactivate(self, identifier: SessionIdentifierType)\
            -> Optional[Session]:
        """Deactivate a session"""
        pass
