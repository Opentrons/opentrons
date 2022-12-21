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
    return create_temp_file(".json", get_protocol(protocol_name, ".json"))


def get_py_protocol(protocol_name: str) -> IO[bytes]:
    """A NamedTemporaryFile valid python protocol."""
    return create_temp_file(".py", get_protocol(protocol_name, ".py"))


def get_bundled_data(data_extension: Literal[".txt", ".csv"]) -> IO[bytes]:
    """A NamedTemporaryFile valid data file."""
    contents = Path(
        f"./tests/integration/protocols/bundled_data{data_extension}"
    ).read_text()
    return create_temp_file(data_extension, contents)


def create_temp_file(
    protocol_extension: Literal[".py", ".json", ".txt", ".csv"], protocol_contents: str
) -> IO[bytes]:
    """Create a temporary file."""
    file = tempfile.NamedTemporaryFile(suffix=protocol_extension)
    file_contents = protocol_contents
    file.write(str.encode(file_contents))
    file.seek(0)
    return file
