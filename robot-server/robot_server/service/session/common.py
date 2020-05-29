from typing import Callable

from opentrons.hardware_control import HardwareAPILike

from robot_server.service.session.models import IdentifierType


class SessionCommon:
    """Data and utilities common to all session types
     provided by session manager"""

    def __init__(self,
                 hardware: HardwareAPILike,
                 is_active: Callable[[IdentifierType], bool]):
        self._hardware = hardware
        self._is_active = is_active

    @property
    def hardware(self) -> HardwareAPILike:
        """Access to robot hardware"""
        return self._hardware

    def is_active(self, identifier: IdentifierType) -> bool:
        """Is session identifier active"""
        return self._is_active(identifier)
