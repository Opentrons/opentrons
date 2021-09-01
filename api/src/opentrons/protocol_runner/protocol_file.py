"""Value objects and models representing protocol files."""
# TODO(mc, 2021-04-30): as these objects are fleshed out, pull in
# existing logic and models from:
#   - api/src/opentrons/protocols/types.py
#   - robot-server/robot_server/service/protocol/models.py
from __future__ import annotations
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import List


class ProtocolFileType(str, Enum):
    """Type of a protocol file.

    Attributes:
        PYTHON: a Python protocol file or module
        JSON: a JSON protocol
    """

    PYTHON = "python"
    JSON = "json"


# TODO(mc, 2021-08-27): rename to ProtocolSource to better reflect
# the fact that a protocol need not be a single file
@dataclass(frozen=True)
class ProtocolFile:
    """A value object representing a protocol file (or files) on disk.

    Attributes:
        protocol_type: Whether the file is a JSON protocol or Python protocol.
        files: The list of files that make up the protocol.
    """

    # TODO(mc, 2021-08-27): `protocol_type` is a little redundant as a field name
    protocol_type: ProtocolFileType
    files: List[Path]
