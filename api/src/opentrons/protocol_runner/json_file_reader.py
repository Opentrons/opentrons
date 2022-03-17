"""JSON file reading."""

from opentrons_shared_data.protocol.models.protocol_schema_v6 import ProtocolSchemaV6
from opentrons.protocol_reader import ProtocolSource


class JsonFileReader:
    """Reads and parses JSON protocol files."""

    @staticmethod
    def read(protocol_source: ProtocolSource) -> ProtocolSchemaV6:
        """Read and parse file into a JsonProtocol model."""
        return ProtocolSchemaV6.parse_file(protocol_source.main_file)
