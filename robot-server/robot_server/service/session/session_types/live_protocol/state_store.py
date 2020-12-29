from typing import Dict, List, Optional, Callable, cast
from dataclasses import dataclass

from opentrons.types import Mount
from opentrons_shared_data.labware.dev_types import LabwareDefinition

from robot_server.service.session.models import command_definitions
from robot_server.service.session.models.common import OffsetVector
from robot_server.service.session.models import command as models
from robot_server.service.session.command_execution import (
    Command, CommandResult)


@dataclass
class LabwareEntry:
    definition: LabwareDefinition
    calibration: OffsetVector
    deckLocation: int


@dataclass
class InstrumentEntry:
    mount: Mount
    name: str


class StateStore:
    def __init__(self):
        self._commands: List[Command] = []
        self._command_results_map: Dict[str, CommandResult] = dict()
        self._handler_map: Dict[
            command_definitions.CommandDefinition,
            Callable[[Command, CommandResult], None]
        ] = {
            command_definitions.EquipmentCommand.load_labware:
                self.handle_load_labware,
            command_definitions.EquipmentCommand.load_instrument:
                self.handle_load_instrument,
        }
        self._labware: Dict[models.IdentifierType, LabwareEntry] = {}
        self._instruments: Dict[models.IdentifierType, InstrumentEntry] = {}

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

    def handle_load_labware(self,
                            command: Command,
                            result: CommandResult) -> None:
        """Update state according to load_labware() command result."""
        result_data = cast(models.LoadLabwareResponseData, result.data)
        command_data = cast(models.LoadLabwareRequestData,
                            command.content.data)
        self._labware[result_data.labwareId] = LabwareEntry(
            definition=result_data.definition,
            calibration=result_data.calibration,
            deckLocation=command_data.location)

    def handle_load_instrument(self,
                               command: Command,
                               result: CommandResult) -> None:
        """Store result of load instrument"""
        result_data = cast(models.LoadInstrumentResponseData, result.data)
        command_data = cast(models.LoadInstrumentRequestData,
                            command.content.data)
        self._instruments[result_data.instrumentId] = InstrumentEntry(
            mount=command_data.mount.to_hw_mount(),
            name=command_data.instrumentName
        )

    def get_labware_by_id(self, labware_id: models.IdentifierType) -> \
            Optional[LabwareEntry]:
        return self._labware.get(labware_id)

    def get_instrument_by_id(self, instrument_id: models.IdentifierType) -> \
            Optional[InstrumentEntry]:
        return self._instruments.get(instrument_id)

    def get_instrument_by_mount(
            self, mount: Mount) -> Optional[InstrumentEntry]:
        for entry in self._instruments.values():
            if entry.mount == mount:
                return entry
        return None

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
