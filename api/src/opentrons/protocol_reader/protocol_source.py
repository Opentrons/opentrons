"""Protocol source value objects."""
from enum import Enum
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Union
from typing_extensions import Literal

from opentrons.protocols.api_support.types import APIVersion


class ProtocolType(str, Enum):
    """Type of protocol, JSON or Python."""

    JSON = "json"
    PYTHON = "python"


class ProtocolFileRole(str, Enum):
    """The purpose of a given file in a protocol.

    Args:
        MAIN: The protocol's main file. In a JSON protocol, this is will
            be the JSON file. In a Python protocol, this is the file
            that exports the main `run` method.
        PYTHON_SUPPORT: An extra Python file that is not the protocol's
            entry point.
        DATA: Catch-all role for non-Python and non-protocol-JSON files.
    """

    MAIN = "main"


@dataclass(frozen=True)
class ProtocolSourceFile:
    """A single file in a protocol.

    Attributes:
        name: The file's basename, with extension.
        role: The file's purpose in the protocol.
    """

    name: str
    role: ProtocolFileRole


@dataclass(frozen=True)
class JsonProtocolConfig:
    """Execution configuration for a JSON protocol.

    Attributes:
        schema_version: JSON schema version of the JSON protocol.
        protocol_type: Type of protocol
    """

    schema_version: int
    protocol_type: Literal[ProtocolType.JSON] = ProtocolType.JSON


@dataclass(frozen=True)
class PythonProtocolConfig:
    """Execution configuration for a Python protocol.

    Attributes:
        api_version: Python Protocol API version of the protocol.
        protocol_type: Type of protocol
    """

    api_version: APIVersion
    protocol_type: Literal[ProtocolType.PYTHON] = ProtocolType.PYTHON


ProtocolConfig = Union[JsonProtocolConfig, PythonProtocolConfig]
"""Union of all protocol execution configurations."""


Metadata = Dict[str, Any]
"""Arbitraty metadata set by a protocol."""


@dataclass(frozen=True)
class ProtocolSource:
    """A value object representing a protocol and its files on disk.

    Attributes:
        path: The directory location of the protocol on disk.
        files: The protocol's files.

    """

    directory: Path
    main_file: Path
    files: List[ProtocolSourceFile]
    metadata: Metadata
    config: ProtocolConfig
