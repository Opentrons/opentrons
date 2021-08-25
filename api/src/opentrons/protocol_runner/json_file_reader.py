"""JSON file reading."""

from opentrons.protocols.models import JsonProtocol
from .protocol_file import ProtocolFile


class JsonFileReader:
    """Reads and parses JSON protocol files."""

    @staticmethod
    def read(protocol_file: ProtocolFile) -> JsonProtocol:
        """Read and parse file into a JsonProtocol model."""
        # TODO(mc, 2021-08-25): validate files list length before access
        contents = protocol_file.files[0].read_text(encoding="utf-8")
        return JsonProtocol.parse_raw(contents)
