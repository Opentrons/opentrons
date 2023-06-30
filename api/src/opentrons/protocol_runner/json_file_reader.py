"""JSON file reading."""

from opentrons_shared_data.protocol.models.protocol_schema_v7 import ProtocolSchemaV7
from opentrons.protocol_reader import ProtocolSource


class JsonFileReader:
    """Reads and parses JSON protocol files."""

    @staticmethod
    def read(protocol_source: ProtocolSource) -> ProtocolSchemaV7:
        """Read and parse file into a JsonProtocol model."""
        return ProtocolSchemaV7.parse_file(protocol_source.main_file)
