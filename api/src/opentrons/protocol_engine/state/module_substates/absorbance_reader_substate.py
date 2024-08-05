"""Heater-Shaker Module sub-state."""
from dataclasses import dataclass
from typing import NewType, Optional, List


AbsorbanceReaderId = NewType("AbsorbanceReaderId", str)


@dataclass(frozen=True)
class AbsorbanceReaderSubState:
    """Absorbance-Plate-Reader-specific state."""

    module_id: AbsorbanceReaderId
    configured: bool
    measured: bool
    data: Optional[List[float]]
    configured_wavelength: Optional[int]
