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
            commands_list.append(parse_obj_as(pe_commands.CommandCreate, dict_command))
        return commands_list
