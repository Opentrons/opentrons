"""Protocol source value objects."""
from enum import Enum
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
from typing_extensions import Literal

from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.models import LabwareDefinition


class ProtocolType(str, Enum):
    """Type of protocol, JSON or Python."""

    JSON = "json"
    PYTHON = "python"


# TODO(mc, 2021-12-07): add data and python support roles
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
        path: The file's path on disk.
        role: The file's purpose in the protocol.
    """

    path: Path
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


# TODO(mc, 2021-12-09): Dict[str, Any] is an overly-permissive approximation
# due to mypy's lack of easy recursive types. Find a more accurate type
Metadata = Dict[str, Any]
"""A protocol's metadata (non-essential info, like author and title).

Robot software may not change how it executes a protocol based on
metadata (excepting a Python protocol's API version, which is in
metadata due to a historical implementation detail).

Metadata must be a simple JSON-serializable dictionary.
"""


@dataclass(frozen=True)
class ProtocolSource:
    """A value object representing a protocol and its source files on disk.

    This includes pointers to the files,
    plus some basic information that can be readily inferred from those files.
    (Excluding information that would require in-depth simulation of the protocol.)

    Attributes:
        directory: The directory containing the protocol files
            (and only the protocol files), or ``None`` if this is unknown.
        main_file: The location of the protocol's main file on disk.
        files: Descriptions of all files that make up the protocol.
        metadata: Arbitrary metadata specified by the protocols.
        config: Protocol execution configuration.
        labware_definitions: Labware definitions provided by separate
            labware files or the main JSON protocol file, if present.
            This is not necessarily the same set of labware definitions
            that the protocol will actually attempt to load.
    """

    directory: Optional[Path]
    main_file: Path
    files: List[ProtocolSourceFile]
    metadata: Metadata
    config: ProtocolConfig
    labware_definitions: List[LabwareDefinition]
