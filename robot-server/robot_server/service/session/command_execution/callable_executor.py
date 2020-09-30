import typing

from robot_server.util import duration
from .base_executor import CommandExecutor
from .command import Command, CompletedCommand, CommandResult


CommandHandler = typing.Callable[
    [str, typing.Dict[typing.Any, typing.Any]],
    typing.Coroutine]


class CallableExecutor(CommandExecutor):
    """A command executor that passes off execution to a callable"""

    def __init__(self, command_handler: CommandHandler):
        """
        Constructor

        :param command_handler: A function
        """
        self._callable = command_handler

    async def execute(self, command: Command) -> CompletedCommand:
        """Execute command"""
        with duration() as time_it:
            name_arg = command.content.name.value
            data = command.content.data
            data_arg = data.dict() if data else {}

            await self._callable(name_arg, data_arg)

        return CompletedCommand(
            content=command.content,
            meta=command.meta,
            result=CommandResult(started_at=time_it.start,
                                 completed_at=time_it.end)
        )
