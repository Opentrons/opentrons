from robot_server.service.session.models import CommandName, CommandDataType
from .command import Command


class CommandQueue:
    """Interface for command queue"""

    async def enqueue(self, command: CommandName, data: CommandDataType) \
            -> Command:
        """Enqueue a command for later execution"""
        raise NotImplementedError()

    async def start(self):
        raise NotImplementedError()

    async def stop(self):
        raise NotImplementedError()

    async def pause(self):
        raise NotImplementedError()

    async def resume(self):
        raise NotImplementedError()
