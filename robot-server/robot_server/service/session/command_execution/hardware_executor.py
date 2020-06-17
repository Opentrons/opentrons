import typing
from opentrons.hardware_control import ThreadManager

from . import Command, CompletedCommand
from . base_executor import CommandExecutor
from ..errors import UnsupportedCommandException
from ..models import CommandDataType, CommandName


COMMAND_HANDLER = typing.Callable[
    [ThreadManager, CommandDataType], typing.Awaitable]


async def home_all_moters(hardware, *args):
    await hardware.home()


async def home_pipette(hardware: ThreadManager, *args):
    await hardware.home()


async def toggle_lights(hardware: ThreadManager, *args):
    light_state = hardware.get_lights()
    await hardware.set_lights(rails=not light_state.get('rails', False))


class HardwareExecutor(CommandExecutor):

    COMMAND_TO_FUNC: typing.Dict[CommandName, COMMAND_HANDLER] = {
        CommandName.home_all_motors: home_all_moters,
        CommandName.home_pipette: home_pipette,
        CommandName.toggle_lights: toggle_lights
    }

    def __init__(self, hardware: ThreadManager):
        self._hardware = hardware

    async def execute(self, command: Command) -> CompletedCommand:
        func = self.COMMAND_TO_FUNC.get(command.content.name)
        if func:
            await func(self._hardware, command.content.data)
        else:
            raise UnsupportedCommandException(
                f"Command '{command.content.name}' is not supported."
            )

