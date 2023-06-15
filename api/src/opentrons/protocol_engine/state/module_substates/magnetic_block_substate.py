"""Magnetic block sub-state."""

from dataclasses import dataclass
from typing import NewType

MagneticBlockId = NewType("MagneticBlockId", str)


@dataclass(frozen=True)
class MagneticBlockSubState:
    """Magnetic Block specific state.

    Provides a read-only state access
    for an individual loaded Magnetic Block.
    """

    module_id: MagneticBlockId
