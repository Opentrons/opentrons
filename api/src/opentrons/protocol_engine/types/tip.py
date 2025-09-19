"""Protocol Engine types to deal with tips."""

from dataclasses import dataclass
from enum import Enum


@dataclass(frozen=True)
class TipGeometry:
    """Tip geometry data.

    Props:
        length: The effective length (total length minus overlap) of a tip in mm.
        diameter: Tip diameter in mm.
        volume: Maximum volume in µL.
    """

    length: float
    diameter: float
    volume: float


class TipRackWellState(Enum):
    """The state of a single tip in a tip rack's well."""

    CLEAN = "clean"
    USED = "used"
    EMPTY = "empty"
