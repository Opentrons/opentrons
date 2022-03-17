"""Translation of JSON protocol commands into ProtocolEngine commands."""
from typing import List
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
        return []
        # for command in protocol.commands:
        #     command.dict()
        #     pe_commands.CommandCreate.parse_obj(command
