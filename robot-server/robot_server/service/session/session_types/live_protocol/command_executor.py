from robot_server.service.session.command_execution import CommandExecutor, \
    Command, CompletedCommand, CommandResult
from robot_server.service.session.errors import UnsupportedCommandException
from robot_server.service.session.session_types.live_protocol.command_interface import \
    CommandInterface
from robot_server.service.session import models
from robot_server.util import duration


class LiveProtocolCommandExecutor(CommandExecutor):

    def __init__(self, command_interface: CommandInterface):
        self._command_interface = command_interface

        self._handler_map = {
            models.EquipmentCommand.load_labware: self._command_interface.handle_load_labware,
            models.EquipmentCommand.load_instrument: self._command_interface.handle_load_instrument,
            models.PipetteCommand.aspirate: self._command_interface.handle_aspirate,
            models.PipetteCommand.dispense: self._command_interface.handle_dispense,
            models.PipetteCommand.pick_up_tip: self._command_interface.handle_pick_up_tip,
            models.PipetteCommand.drop_tip: self._command_interface.handle_drop_tip,
        }

    async def execute(self, command: Command) -> CompletedCommand:
        handler = self._handler_map.get(command.content.name)
        if handler:
            with duration() as timed:
                data = await handler(command.content.data)
        else:
            raise UnsupportedCommandException(
                f"Command '{command.content.name}' is not supported."
            )
        return CompletedCommand(
            content=command.content,
            meta=command.meta,
            result=CommandResult(started_at=timed.start,
                                 completed_at=timed.end,
                                 data=data),
        )
