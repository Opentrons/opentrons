"""Datatype for starting a protocol run on a selected robot."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class ProtocolRunTarget:
    """I want to use a protocol and select a robot (optional CSV params)."""

    protocol_name: str
    robot_name: str
    csv_path: Path | None = None
