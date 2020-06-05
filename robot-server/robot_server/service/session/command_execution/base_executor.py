from robot_server.service.session.models import CommandName, CommandDataType
from .command import Command


class CommandExecutor:
    """Interface for command executors"""

    async def execute(self, command: CommandName, data: CommandDataType) \
            -> Command:
        """Execute a command"""
        raise NotImplementedError()
