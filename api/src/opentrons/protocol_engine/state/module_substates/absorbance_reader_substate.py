"""Heater-Shaker Module sub-state."""
from dataclasses import dataclass
from typing import List, NewType, Optional


AbsorbanceReaderId = NewType("AbsorbanceReaderId", str)


@dataclass(frozen=True)
class AbsorbanceReaderSubState:
    """Absorbance-Plate-Reader-specific state."""

    module_id: AbsorbanceReaderId
    initialized: bool
    is_lid_open: bool
    is_loaded: bool
    is_measuring: bool
    temperature: float
    sample_wavelength: Optional[int]
    supported_wavelengths: Optional[List[int]]
