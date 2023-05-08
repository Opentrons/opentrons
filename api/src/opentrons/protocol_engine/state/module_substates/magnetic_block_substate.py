"""Magnetic module sub-state."""

from dataclasses import dataclass
from typing import NewType

from opentrons.protocol_engine.types import MagneticBlockModel


MagneticBlockId = NewType("MagneticBlockId", str)


@dataclass(frozen=True)
class MagneticBlockSubState:
    """Magnetic Module specific state.

    Provides calculations and read-only state access
    for an individual loaded Magnetic Block.
    """

    module_id: MagneticBlockId
    model: MagneticBlockModel
