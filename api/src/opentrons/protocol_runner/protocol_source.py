"""Value objects and models representing protocol files."""
# TODO(mc, 2021-04-30): as these objects are fleshed out, pull in
# existing logic and models from:
#   - api/src/opentrons/protocols/types.py
#   - robot-server/robot_server/service/protocol/models.py
from __future__ import annotations
from dataclasses import dataclass
from pathlib import Path
from typing import List

from .pre_analysis import PreAnalysis


@dataclass(frozen=True)
class ProtocolSource:
    """A value object representing a protocol file (or files) on disk.

    Attributes:
        files: The source files' location on disk.
        pre_analysis: Validated information about the protocol.
    """

    files: List[Path]
    pre_analysis: PreAnalysis
