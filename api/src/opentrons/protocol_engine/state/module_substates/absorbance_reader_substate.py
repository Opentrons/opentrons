"""Heater-Shaker Module sub-state."""
from dataclasses import dataclass
from typing import List, NewType, Optional, Dict

from opentrons.protocol_engine.errors import CannotPerformModuleAction

AbsorbanceReaderId = NewType("AbsorbanceReaderId", str)
AbsorbanceReaderLidId = NewType("AbsorbanceReaderLidId", str)
AbsorbanceReaderMeasureMode = NewType("AbsorbanceReaderMeasureMode", str)


@dataclass(frozen=True)
class AbsorbanceReaderSubState:
    """Absorbance-Plate-Reader-specific state."""

    module_id: AbsorbanceReaderId
    configured: bool
    measured: bool
    is_lid_on: bool
    data: Optional[Dict[int, Dict[str, float]]]
    configured_wavelengths: Optional[List[int]]
    measure_mode: Optional[AbsorbanceReaderMeasureMode]
    reference_wavelength: Optional[int]
    lid_id: Optional[str]

    def raise_if_lid_status_not_expected(self, lid_on_expected: bool) -> None:
        """Raise if the lid status is not correct."""
        match = self.is_lid_on is lid_on_expected
        if not match:
            raise CannotPerformModuleAction(
                "Cannot perform lid action because the lid is already "
                f"{'closed' if self.is_lid_on else 'open'}"
            )
