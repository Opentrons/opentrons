from datetime import datetime

from opentrons.calibration.check.models import SessionType

from robot_server.service.session.command import Command
from robot_server.service.session.common import SessionCommon
from robot_server.service.session.models import create_identifier,\
    IdentifierType


class Session:
    """Base class of all sessions"""

    def __init__(self, common: SessionCommon):
        """
        Constructor

        :param common: Data and utilities common to all session types
        """
        self._id = create_identifier()
        self._created_on = datetime.utcnow()
        self._common = common

    @classmethod
    async def create(cls, common: SessionCommon) -> 'Session':
        """Create instance"""
        return cls(common)

    async def clean_up(self):
        """Called before session is deleted"""
        pass

    async def enqueue_command(self, command: Command):
        """Enqueue a command for later execution"""
        raise NotImplementedError()

    async def execute_command(self, command: Command):
        """Execute the command"""
        raise NotImplementedError()

    @property
    def identifier(self) -> IdentifierType:
        return self._id

    @property
    def session_type(self) -> SessionType:
        return SessionType.null

    @property
    def created_on(self) -> datetime:
        return self._created_on

    def __str__(self) -> str:
        return f"Session(" \
               f"session_type={self.session_type}," \
               f"identifier={self.identifier}," \
               f"created_on={self.created_on}," \
               f")"
