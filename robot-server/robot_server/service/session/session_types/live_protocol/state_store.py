from typing import Dict, List, Optional, Callable, cast
from dataclasses import dataclass

from opentrons_shared_data.labware.dev_types import LabwareDefinition

from robot_server.service.session.models.common import OffsetVector
from robot_server.service.session.models import command as models
from robot_server.service.session.command_execution import (
    Command, CommandResult)


@dataclass
class LabwareEntry:
    definition: LabwareDefinition
    calibration: OffsetVector
    deckLocation: int


class StateStore:
    def __init__(self):
        self._commands: List[Command] = []
        self._command_results_map: Dict[str, CommandResult] = dict()
        self._handler_map: Dict[
            models.CommandDefinition,
            Callable[[Command, CommandResult], None]
        ] = {
            # TODO AL 2020-09-22. mypy is mysteriously complaining about the
            #  types of these keys.
            models.EquipmentCommand.load_labware:  # type: ignore
                self.handle_load_labware,  # noqa: E131
        }
        self._labware: Dict[models.IdentifierType, LabwareEntry] = {}

    def handle_command_request(self, command: Command) -> None:
        """
        Place a newly requested command in the state store.
        """
        self._commands.append(command)

    # TODO(mc, 2020-09-17): add calls to subtree handlers
    def handle_command_result(
            self, command: Command, result: CommandResult) -> None:
        """
        Update the state upon completion of a handled command.
        """
        self._command_results_map[command.meta.identifier] = result
        handler = self._handler_map.get(command.content.name)
        if handler:
            handler(command, result)

    def handle_load_labware(self, command: Command,
                            result: CommandResult) -> None:
        """
        Update state according to load_labware() command result.
        """
        result_data = cast(models.LoadLabwareResponse, result.data)
        command_data = cast(models.LoadLabwareRequest, command.content.data)
        self._labware[result_data.labwareId] = LabwareEntry(
            definition=result_data.definition,
            calibration=result_data.calibration,
            deckLocation=command_data.location)

    def get_labware_by_id(self, labware_id: models.IdentifierType) -> \
            Optional[LabwareEntry]:
        return self._labware.get(labware_id)

    def get_commands(self) -> List[Command]:
        """
        Selector method to return the current state of all commands
        """
        return self._commands

    def get_command_result_by_id(
            self, identifier: str) -> Optional[CommandResult]:
        """
        Selector method to return the result of a command by ID if that
        command has completed.
        """
        return self._command_results_map.get(identifier)
