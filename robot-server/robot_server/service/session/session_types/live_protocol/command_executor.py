import logging
from typing import Dict, Any, Union

from robot_server.service.session.command_execution import (
    CommandExecutor, Command, CompletedCommand, CommandResult)
from robot_server.service.session.errors import UnsupportedCommandException
from robot_server.service.session.session_types.live_protocol.command_interface import CommandInterface  # noqa: E501
from robot_server.service.session.session_types.live_protocol.state_store import StateStore  # noqa: E501
from robot_server.service.session.models import (
    command_definitions as models, command as command_models)
from robot_server.util import duration

log = logging.getLogger(__name__)


class LiveProtocolCommandExecutor(CommandExecutor):

    def __init__(
            self,
            command_interface: CommandInterface,
            state_store: StateStore):
        self._store = state_store
        self._command_interface = command_interface

        self._handler_map: Dict[
            models.CommandDefinition,
            Any
        ] = {
            models.EquipmentCommand.load_labware:
                self._command_interface.handle_load_labware,
            models.EquipmentCommand.load_instrument:
                self._command_interface.handle_load_instrument,
            models.PipetteCommand.aspirate:
                self._command_interface.handle_aspirate,
            models.PipetteCommand.dispense:
                self._command_interface.handle_dispense,
            models.PipetteCommand.pick_up_tip:
                self._command_interface.handle_pick_up_tip,
            models.PipetteCommand.drop_tip:
                self._command_interface.handle_drop_tip,
        }

    async def execute(self, command: Command) -> CompletedCommand:
        # add command to state
        self._store.handle_command_request(command)

        # handle side-effects with timing
        handler = self._handler_map.get(command.request.command)

        if handler:
            with duration() as timed:
                data = await handler(command.request.data)
        else:
            raise UnsupportedCommandException(
                f"Command '{command.request.command}' is not supported."
            )

        result = CommandResult[
            Union[
                command_models.LoadLabwareResponseData,
                command_models.LoadInstrumentResponseData
            ]](started_at=timed.start,
               completed_at=timed.end,
               data=data)

        # add result to state
        self._store.handle_command_result(command, result)

        # return completed command to session
        return CompletedCommand(
            request=command.request,
            meta=command.meta,
            result=result,
        )
