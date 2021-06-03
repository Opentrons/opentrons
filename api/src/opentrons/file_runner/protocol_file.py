"""Value objects and models representing protocol files."""
# TODO(mc, 2021-04-30): as these objects are fleshed out, pull in
# existing logic and models from:
#   - api/src/opentrons/protocols/types.py
#   - robot-server/robot_server/service/protocol/models.py
from __future__ import annotations
from dataclasses import dataclass
from enum import Enum
from pathlib import Path


class ProtocolFileType(str, Enum):
    """Type of a protocol file.

    Attributes:
        PYTHON: a Python protocol file or module
        JSON: a JSON protocol
    """

    PYTHON = "python"
    JSON = "json"


@dataclass(frozen=True)
class ProtocolFile:
    """A value object representing a protocol file on disk.

    Attributes:
        file_type: Whether the file is a JSON protocol or Python protocol
    """

    file_path: Path
    file_type: ProtocolFileType
