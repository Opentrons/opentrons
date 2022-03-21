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
                # translated_obj.params.pipetteName = protocol.pipettes[command.params.pipetteId].name
            # elif command.commandType == "loadModule":
            #     translated_obj.params.model = protocol.modules[command.params.moduleId]
            # elif command.commandType == "loadLabware":
            #     translated_obj.params.displayName = protocol.labware[command.params.labwareId].displayName
            #     translated_obj.params.version = protocol.labwareDefinitions.version
            #     translated_obj.params.namespace = protocol.labwareDefinitions.namespace
            translated_obj = parse_obj_as(pe_commands.CommandCreate, dict_command)
            commands_list.append(translated_obj)
        return commands_list


