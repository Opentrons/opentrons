import logging

from opentrons.protocol_engine import ProtocolEngine, commands

from robot_server.service.session.command_execution import (
    CommandExecutor, Command, CompletedCommand, CommandResult)
from robot_server.service.session.errors import UnsupportedCommandException, \
    CommandExecutionException
from robot_server.service.session.models import (
    command_definitions as models)

log = logging.getLogger(__name__)


class LiveProtocolCommandExecutor(CommandExecutor):

    ACCEPTED_COMMANDS = {
        models.EquipmentCommand.load_labware,
        models.EquipmentCommand.load_instrument,
        models.PipetteCommand.aspirate,
        models.PipetteCommand.dispense,
        models.PipetteCommand.pick_up_tip,
        models.PipetteCommand.drop_tip,
    }

    def __init__(
            self,
            protocol_engine: ProtocolEngine):
        self._protocol_engine = protocol_engine

    async def execute(self, command: Command) -> CompletedCommand:
        """Execute a live protocol command."""
        if command.request.command not in self.ACCEPTED_COMMANDS:
            raise UnsupportedCommandException(
                f"Command '{command.request.command}' is not supported."
            )

        data = await self._protocol_engine.execute_command(
            request=command.request.data,
            command_id=command.meta.identifier)

        if isinstance(data, commands.FailedCommand):
            raise CommandExecutionException(reason=str(data.error))
        else:
            result = CommandResult(
                started_at=data.started_at,
                completed_at=data.completed_at,
                data=data.result)

            # return completed command to session
            return CompletedCommand(
                request=command.request,
                meta=command.meta,
                result=result,
            )
