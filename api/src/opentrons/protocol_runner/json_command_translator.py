"""Translation of JSON protocol commands into ProtocolEngine commands."""
from typing import List, Union
from pydantic import parse_obj_as
from opentrons_shared_data.protocol.models import ProtocolSchemaV6, Command
from opentrons.protocol_engine import (
    commands as pe_commands
)


class CommandTranslatorError(Exception):
    """An error raised to indicate an internal programmer error."""

    pass


class JsonCommandTranslator:
    """Class that translates commands from PD/JSON to ProtocolEngine."""

    def translate(
            self,
            protocol: ProtocolSchemaV6,
    ) -> List[pe_commands.CommandCreate]:
        commands_list: List[Union[pe_commands.CommandCreate, Command]] = []
        for command in protocol.commands:
            dict_command = command.dict(exclude_none=True)
            # dont not parse loadLiquid to CommandCreate objects
            if command.commandType == "loadLiquid":
                commands_list.append(command)
                continue
            if command.commandType == "loadPipette":
                dict_command["params"].update({"pipetteName":protocol.pipettes[command.params.pipetteId].name})
            elif command.commandType == "loadModule":
                dict_command["params"].update({"model":protocol.modules[command.params.moduleId].model})
            elif command.commandType == "loadLabware":
                # TODO define a constructor for LoadLabwareParams that accepts these fields
                print(command.params.location)
                definition_id = protocol.labware[command.params.labwareId].definitionId
                dict_command["params"].update({"displayName": protocol.labware[command.params.labwareId].displayName})
                dict_command["params"].update({"version": protocol.labwareDefinitions[definition_id].version})
                dict_command["params"].update({"namespace": protocol.labwareDefinitions[definition_id].namespace})
                dict_command["params"].update({"loadName": protocol.labwareDefinitions[definition_id].parameters.loadName})
                print(dict_command)
            translated_obj = parse_obj_as(pe_commands.CommandCreate, dict_command)
            commands_list.append(translated_obj)
        return commands_list


