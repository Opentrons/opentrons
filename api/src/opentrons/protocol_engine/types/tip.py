"""Protocol Engine types to deal with tips."""

from enum import Enum

from pydantic import BaseModel, ConfigDict


class TipGeometry(BaseModel):
    """Tip geometry data.

    Props:
        length: The effective length (total length minus overlap) of a tip in mm.
        diameter: Tip diameter in mm.
        volume: Maximum volume in µL.
    """

    model_config = ConfigDict(frozen=True)

    length: float
    diameter: float
    volume: float


class TipRackWellState(Enum):
    """The state of a single tip in a tip rack's well."""

    CLEAN = "clean"
    USED = "used"
    EMPTY = "empty"
