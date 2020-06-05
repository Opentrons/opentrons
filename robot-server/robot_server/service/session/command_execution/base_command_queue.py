from robot_server.service.session.models import CommandName, CommandDataType
from .command import Command
from ..errors import UnsupportedFeature


class CommandQueue:
    """Interface for command queue"""

    async def enqueue(self, command: CommandName, data: CommandDataType) \
            -> Command:
        """Enqueue a command for later execution"""
        raise UnsupportedFeature()

    async def start(self):
        raise UnsupportedFeature()

    async def stop(self):
        raise UnsupportedFeature()

    async def pause(self):
        raise UnsupportedFeature()

    async def resume(self):
        raise UnsupportedFeature()
