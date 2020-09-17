import typing
from opentrons.hardware_control import ThreadManager

from . import Command, CompletedCommand, CommandResult
from . base_executor import CommandExecutor
from ..errors import UnsupportedCommandException
from ..models.command import (
    CommandDataType, RobotCommand, CommandDefinition)
from robot_server.util import duration


COMMAND_HANDLER = typing.Callable[
    [ThreadManager, CommandDataType], typing.Awaitable]


async def home_all_motors(hardware, *args):
    await hardware.home()


async def toggle_lights(hardware: ThreadManager, *args):
    light_state = hardware.get_lights()
    await hardware.set_lights(rails=not light_state.get('rails', False))


class HardwareExecutor(CommandExecutor):
    """A command executor that executes direct hardware commands"""

    COMMAND_TO_FUNC: typing.Dict[CommandDefinition, COMMAND_HANDLER] = {
        RobotCommand.home_all_motors: home_all_motors,
        RobotCommand.toggle_lights: toggle_lights
    }

    def __init__(self,
                 hardware: ThreadManager,
                 command_filter: typing.Optional[typing.Set[RobotCommand]]):
        """
        Constructor

        :param hardware: hardware api access
        :param command_filter: a set of supported commands. All commands will
            be supported if None
        """
        self._hardware = hardware
        self._command_filter = command_filter

    async def execute(self, command: Command) -> CompletedCommand:
        func = self.get_handler(command.content.name)
        if func:
            with duration() as timed:
                await func(self._hardware, command.content.data)
        else:
            raise UnsupportedCommandException(
                f"Command '{command.content.name}' is not supported."
            )
        return CompletedCommand(
            content=command.content,
            meta=command.meta,
            result=CommandResult(started_at=timed.start,
                                 completed_at=timed.end)
        )

    def get_handler(self, command_name: CommandDefinition) \
            -> typing.Optional[COMMAND_HANDLER]:
        """Get the handler for the command type"""
        if self._command_filter is not None:
            if command_name not in self._command_filter:
                return None
        return self.COMMAND_TO_FUNC.get(command_name)


class DefaultHardwareExecutor(HardwareExecutor):
    """The default command executor"""
    def __init__(self, hardware: ThreadManager):
        super().__init__(hardware, {RobotCommand.home_all_motors,
                                    RobotCommand.home_pipette,
                                    RobotCommand.toggle_lights})
