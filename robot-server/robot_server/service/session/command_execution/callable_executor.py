import typing

from .base_executor import CommandExecutor
from .command import Command, CompletedCommand, complete_command


CallableType = typing.Callable[
    [str, typing.Dict[typing.Any, typing.Any]],
    typing.Coroutine]


class CallableExecutor(CommandExecutor):
    """A command executor that passes off execution to a callable"""

    def __init__(self, command_handler: CallableType):
        """
        Constructor

        :param command_handler: A function
        """
        self. _callable = command_handler

    async def execute(self, command: Command) -> CompletedCommand:
        """Execute command"""
        name_arg = command.content.name.value
        data = command.content.data
        data_arg = data.dict() if data else {}

        await self._callable(name_arg, data_arg)

        return complete_command(command=command, status="executed")
