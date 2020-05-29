from uuid import UUID

from robot_server.service.models.session import CommandName, \
    CommandDataType
from robot_server.service.session.command import Command
from robot_server.service.session.manager import SessionManager


SessionIdentifierType = UUID


class Session:
    """Base class of all sessions"""

    def __init__(self, manager: SessionManager):
        self._manager = manager

    def clean_up(self):
        """Called before session is to be deleted"""
        pass

    def create_command(self,
                       command_name: CommandName,
                       command_data: CommandDataType) -> Command:
        """Create a command object"""
        return Command(name=command_name,
                       data=command_data,
                       session=self)

    def execute_command(self, command: Command):
        """Execute the command"""
        raise NotImplementedError()
