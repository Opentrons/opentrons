import asyncio
import logging
from typing import Optional, Tuple, Dict, Type

from opentrons.hardware_control import ThreadManager, ThreadedAsyncLock

from robot_server.service.protocol.manager import ProtocolManager
from robot_server.service.session.errors import SessionCreationException, \
    UnsupportedFeature
from robot_server.service.session.session_types.base_session import BaseSession
from robot_server.service.session.configuration import SessionConfiguration
from robot_server.service.session.models import IdentifierType, SessionType
from robot_server.service.session.session_types import (
    NullSession, CheckSession, SessionMetaData, TipLengthCalibration,
    DeckCalibrationSession, DefaultSession)
from robot_server.service.session.session_types.protocol.session import \
    ProtocolSession

log = logging.getLogger(__name__)

SessionTypeToClass: Dict[SessionType, Type[BaseSession]] = {
    SessionType.null: NullSession,
    SessionType.calibration_check: CheckSession,
    SessionType.tip_length_calibration: TipLengthCalibration,
    SessionType.deck_calibration: DeckCalibrationSession,
    SessionType.default: DefaultSession,
    SessionType.protocol: ProtocolSession,
}


class SessionManager:
    """Manager of session instances"""

    def __init__(self,
                 hardware: ThreadManager,
                 motion_lock: ThreadedAsyncLock,
                 protocol_manager: ProtocolManager):
        """
        Construct the session manager

        :param hardware: ThreadManager to interact with hardware
        :param protocol_manager: ProtocolManager for protocol related sessions
        """
        self._sessions: Dict[IdentifierType, BaseSession] = {}
        self._active = ActiveSessionId(
            default_id=DefaultSession.DEFAULT_ID
        )
        # Create object supplied to all sessions
        self._session_common = SessionConfiguration(
            hardware=hardware,
            is_active=self.is_active,
            motion_lock=motion_lock,
            protocol_manager=protocol_manager
        )
        # Create the default session.
        asyncio.new_event_loop().run_until_complete(
            self.add(SessionType.default, SessionMetaData())
        )

    async def add(self,
                  session_type: SessionType,
                  session_meta_data: SessionMetaData,
                  ) -> BaseSession:
        """Add a new session"""
        cls = SessionTypeToClass.get(session_type)
        if not cls:
            raise SessionCreationException(
                "Session type is not supported"
            )
        session = await cls.create(configuration=self._session_common,
                                   instance_meta=session_meta_data)
        if session.meta.identifier in self._sessions:
            raise SessionCreationException(
                f"Session with id {session.meta.identifier} already exists"
            )
        self._sessions[session.meta.identifier] = session
        self._active.active_id = session.meta.identifier
        log.debug(f"Added new session: {session}")
        return session

    async def remove(self, identifier: IdentifierType) \
            -> Optional[BaseSession]:
        """Remove a session"""
        if identifier == DefaultSession.DEFAULT_ID:
            raise UnsupportedFeature(f"Cannot remove {identifier} session")

        session = self.deactivate(identifier)
        if session:
            del self._sessions[session.meta.identifier]
            await session.clean_up()
            log.debug(f"Removed session: {session}")
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
        return self.get_by_id(self._active.active_id)

    def is_active(self, identifier: IdentifierType) -> bool:
        """Check if session identifier is active"""
        return identifier == self._active.active_id

    def activate(self, identifier: IdentifierType) -> Optional[BaseSession]:
        """Activate a session"""
        session = self.get_by_id(identifier)
        if session:
            self._active.active_id = identifier
        return session

    def deactivate(self, identifier: IdentifierType) \
            -> Optional[BaseSession]:
        """Deactivate a session"""
        if identifier == self._active.active_id:
            self._active.active_id = None
        return self.get_by_id(identifier)


class ActiveSessionId:
    def __init__(self, default_id: IdentifierType):
        self._default_id = default_id
        self._active_id = default_id

    @property
    def active_id(self):
        return self._active_id

    @active_id.setter
    def active_id(self, val):
        self._active_id = val if val is not None else self._default_id

    @property
    def default_id(self):
        return self._default_id
