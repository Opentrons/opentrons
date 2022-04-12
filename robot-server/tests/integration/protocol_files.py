"""Tools for temporary protocol files."""
from pathlib import Path
import tempfile
from typing import IO
from typing_extensions import Literal


def get_protocol(
    protocol_name: str, protocol_extension: Literal[".py", ".json"]
) -> str:
    """A NamedTemporaryFile valid json protocol."""
    contents = ""
    with open(Path(f"./tests/integration/protocols/simple{protocol_extension}")) as f:
        contents = f.read()
        contents = contents.replace(
            '"protocolName": "simple"', f'"protocolName": "{protocol_name}"'
        )
    return contents


def get_json_protocol(protocol_name: str) -> IO[bytes]:
    """A NamedTemporaryFile valid python protocol."""
    return create_temp_protocol(".json", get_protocol(protocol_name, ".json"))


def get_py_protocol(protocol_name: str) -> IO[bytes]:
    """A NamedTemporaryFile valid python protocol."""
    return create_temp_protocol(".py", get_protocol(protocol_name, ".py"))


def create_temp_protocol(
    protocol_extension: Literal[".py", ".json"], protocol_contents: str
) -> IO[bytes]:
    """Create a temporary protocol file."""
    file = tempfile.NamedTemporaryFile(suffix=protocol_extension)
    file_contents = protocol_contents
    file.write(str.encode(file_contents))
    file.seek(0)
    return file
