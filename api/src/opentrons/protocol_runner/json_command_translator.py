"""Translation of JSON protocol commands into ProtocolEngine commands."""
from typing import cast, List, Optional, Tuple
from pydantic import parse_obj_as
from opentrons_shared_data.protocol.models import ProtocolSchemaV6, Command
from opentrons.protocol_engine import (
    commands as pe_commands
)


class CommandTranslatorError(Exception):
    """An error raised to indicate an internal programmer error."""

    pass


def get_labware_command(protocol: ProtocolSchemaV6, command: Command) -> pe_commands.LoadLabwareCreate:
    dict_command = command.dict()
    labware_id = command.params.labwareId
    assert labware_id is not None
    definition_id = protocol.labware[labware_id].definitionId
    assert definition_id is not None
    dict_command["params"].update({"displayName": protocol.labware[labware_id].displayName})
    dict_command["params"].update({"version": protocol.labwareDefinitions[definition_id].version})
    dict_command["params"].update({"namespace": protocol.labwareDefinitions[definition_id].namespace})
    dict_command["params"].update({"loadName": protocol.labwareDefinitions[definition_id].parameters.loadName})
    labware_command = pe_commands.LoadLabwareCreate.parse_obj(dict_command)
    return labware_command


class JsonCommandTranslator:
    """Class that translates commands from PD/JSON to ProtocolEngine."""

    def translate(
            self,
            protocol: ProtocolSchemaV6,
    ) -> List[pe_commands.CommandCreate]:
        commands_list: List[pe_commands.CommandCreate] = []
        for command in protocol.commands:
            dict_command = command.dict(exclude_none=True)
            if command.commandType == "loadPipette":
                pipette_id = command.params.pipetteId
                assert pipette_id is not None
                dict_command["params"].update(dict(pipetteName=protocol.pipettes[pipette_id].name))
            elif command.commandType == "loadModule":
                module_id = command.params.moduleId
                modules = protocol.modules
                assert module_id is not None
                assert modules is not None
                dict_command["params"].update({"model": modules[module_id].model})
            elif command.commandType == "loadLabware":
                labware_command = get_labware_command(protocol, command)
                commands_list.append(labware_command)
                continue

                print(dict_command)
            translated_obj = cast(
                pe_commands.CommandCreate,
                parse_obj_as(
                    # https://github.com/samuelcolvin/pydantic/issues/1847
                    pe_commands.CommandCreate,  # type: ignore[arg-type]
                    dict_command,
                )
            )
            commands_list.append(translated_obj)
        return commands_list

