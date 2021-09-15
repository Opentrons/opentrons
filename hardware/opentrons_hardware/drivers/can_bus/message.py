"""Can message."""
from __future__ import annotations

from dataclasses import dataclass
from .arbitration_id import ArbitrationId


@dataclass
class CanMessage:
    """A can message."""

    arbitration_id: ArbitrationId
    data: bytearray
