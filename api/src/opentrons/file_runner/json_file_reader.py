"""JSON file reading."""

from opentrons.protocols.models import JsonProtocol
from .protocol_file import ProtocolFile


class JsonFileReader:
    """Reads and parses JSON protocol files."""

    @staticmethod
    def read(file: ProtocolFile) -> JsonProtocol:
        """Read and parse file into a JsonProtocol model."""
        contents = file.file_path.read_text(encoding="utf-8")
        return JsonProtocol.parse_raw(contents)
