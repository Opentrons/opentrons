from opentrons.hardware_control import ThreadManager

from . import Command, CompletedCommand
from . base_executor import CommandExecutor


class HardwareExecutor(CommandExecutor):

    def __init__(self, hardware: ThreadManager):
        self._hardware = hardware

    async def execute(self, command: Command) -> CompletedCommand:
        return await super().execute(command)
