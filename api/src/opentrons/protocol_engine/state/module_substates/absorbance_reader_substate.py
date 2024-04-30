"""Heater-Shaker Module sub-state."""
from dataclasses import dataclass
from typing import NewType, List

from opentrons.protocol_engine.types import (
    TemperatureRange,
    SpeedRange,
    HeaterShakerLatchStatus,
)

AbsorbanceReaderId = NewType("AbsorbanceReaderId", str)


@dataclass(frozen=True)
class AbsorbanceReaderSubState:
    """Absorbance-Plate-Reader-specific state."""

    module_id: AbsorbanceReaderId
    is_lid_open: bool
    is_loaded: bool
    sample_wavelength: int
    supported_wavelengths: List[int]
