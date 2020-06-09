from .command import Command
from ..errors import UnsupportedFeature


class CommandQueue:
    """Interface for command queue"""

    async def enqueue(self, command: Command):
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
