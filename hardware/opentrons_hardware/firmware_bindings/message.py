"""Can message."""
from __future__ import annotations

from dataclasses import dataclass
from .arbitration_id import ArbitrationId


@dataclass(frozen=True)
class CanMessage:
    """A can message."""

    arbitration_id: ArbitrationId
    data: bytes
