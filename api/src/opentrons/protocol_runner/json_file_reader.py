"""JSON file reading."""

from opentrons.protocols.models import JsonProtocol
from .protocol_source import ProtocolSource


class JsonFileReader:
    """Reads and parses JSON protocol files."""

    @staticmethod
    def read(protocol_file: ProtocolSource) -> JsonProtocol:
        """Read and parse file into a JsonProtocol model."""
        # TODO(mc, 2021-09-17): access the "main file" in a more
        # explicit way than the first entry in the files list
        return JsonProtocol.parse_file(protocol_file.files[0])
