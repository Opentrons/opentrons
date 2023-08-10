"""JSON file reading."""
from typing import Union

from opentrons_shared_data.protocol.models.protocol_schema_v6 import ProtocolSchemaV6
from opentrons_shared_data.protocol.models.protocol_schema_v7 import ProtocolSchemaV7
from opentrons.protocol_reader import ProtocolSource, JsonProtocolConfig


class JsonFileReader:
    """Reads and parses JSON protocol files."""

    @staticmethod
    def read(
        protocol_source: ProtocolSource,
    ) -> Union[ProtocolSchemaV6, ProtocolSchemaV7]:
        """Read and parse file into a JsonProtocol model."""
        if (
            isinstance(protocol_source.config, JsonProtocolConfig)
            and protocol_source.config.schema_version == 6
        ):
            return ProtocolSchemaV6.parse_file(protocol_source.main_file)
        else:
            return ProtocolSchemaV7.parse_file(protocol_source.main_file)
