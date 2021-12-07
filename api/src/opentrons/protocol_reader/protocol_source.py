"""Protocol source value objects."""
from enum import Enum
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Union
from typing_extensions import Literal

from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.models import LabwareDefinition


class ProtocolType(str, Enum):
    """Type of protocol, JSON or Python."""

    JSON = "json"
    PYTHON = "python"


# TODO(mc, 2021-12-07): add custom labware, data, and python support roles
class ProtocolFileRole(str, Enum):
    """The purpose of a given file in a protocol.

    Args:
        MAIN: The protocol's main file. In a JSON protocol, this is will
            be the JSON file. In a Python protocol, this is the file
            that exports the main `run` method.
        LABWARE: A labware definition file, loadable by a
            Python file in the same protocol.
    """

    MAIN = "main"
    LABWARE = "labware"


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
"""Arbitrary metadata set by a protocol."""


@dataclass(frozen=True)
class ProtocolSource:
    """A value object representing a protocol and its files on disk.

    Attributes:
        directory: The directory location of the protocol on disk.
        main_file: The location of the protocol's main file on disk.
        files: Descriptions of all files that make up the protocol.
        metadata: Arbitrary metadata specified by the protocols.
        config: Protocol execution configuration.
    """

    directory: Path
    main_file: Path
    files: List[ProtocolSourceFile]
    metadata: Metadata
    config: ProtocolConfig
    labware: List[LabwareDefinition]
