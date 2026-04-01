from ..errors import UnsupportedCommandException
from .command import Command, CompletedCommand


class CommandExecutor:
    """Interface for command executors"""

    async def execute(self, command: Command) -> CompletedCommand:
        """
        Execute a command

        :raise SessionCommandException:
        """
        raise UnsupportedCommandException(
            f"'{command.request.command}' is not supported"
        )
