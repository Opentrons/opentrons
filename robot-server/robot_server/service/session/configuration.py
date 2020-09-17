from typing import Callable

from opentrons.hardware_control import ThreadManager, ThreadedAsyncLock

from robot_server.service.protocol.manager import ProtocolManager
from robot_server.service.session.session_models.common import IdentifierType


class SessionConfiguration:
    """Data and utilities common to all session types
     provided by session manager"""

    def __init__(self,
                 hardware: ThreadManager,
                 is_active: Callable[[IdentifierType], bool],
                 motion_lock: ThreadedAsyncLock,
                 protocol_manager: ProtocolManager):
        self._hardware = hardware
        self._is_active = is_active
        self._motion_lock = motion_lock
        self._protocol_manager = protocol_manager

    @property
    def hardware(self) -> ThreadManager:
        """Access to robot hardware"""
        return self._hardware

    def is_active(self, identifier: IdentifierType) -> bool:
        """Is session identifier active"""
        return self._is_active(identifier)

    @property
    def motion_lock(self) -> ThreadedAsyncLock:
        return self._motion_lock

    @property
    def protocol_manager(self) -> ProtocolManager:
        """Access the protocol manager"""
        return self._protocol_manager
