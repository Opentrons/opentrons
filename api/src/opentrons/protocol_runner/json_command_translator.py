"""Translation of JSON protocol commands into ProtocolEngine commands."""
from typing import List
from pydantic import parse_obj_as
from opentrons_shared_data.protocol.models import ProtocolSchemaV6
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
        commands_list: List[pe_commands.CommandCreate] = []
        for command in protocol.commands:
            dict_command = command.dict()
            if command.commandType == "loadPipette":
                dict_command["params"].update({"pipetteName":protocol.pipettes[command.params.pipetteId].name})
            elif command.commandType == "loadModule":
                dict_command["params"].update({"model":protocol.modules[command.params.moduleId].model})
            elif command.commandType == "loadLabware":
                dict_command["params"].update({"displayName": protocol.labware[command.params.labwareId].displayName})
                dict_command["params"].update({"version": protocol.labwareDefinitions[protocol.labware[command.params.labwareId].definitionId].version})
                dict_command["params"].update({"namespace": protocol.labwareDefinitions[protocol.labware[command.params.labwareId].definitionId].namespace})
                print(dict_command)
            translated_obj = parse_obj_as(pe_commands.CommandCreate, dict_command)
            commands_list.append(translated_obj)
        return commands_list


