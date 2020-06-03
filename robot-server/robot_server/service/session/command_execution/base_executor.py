from robot_server.service.session.command_execution.command import Command


class CommandExecutor:
    """Interface for command executors"""

    async def execute(self, command: Command):
        """Execute a command"""
        raise NotImplementedError()
