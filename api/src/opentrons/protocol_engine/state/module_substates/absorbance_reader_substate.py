"""Heater-Shaker Module sub-state."""
from dataclasses import dataclass
from typing import List, NewType, Optional, Dict

from opentrons.protocol_engine.errors import CannotPerformModuleAction

AbsorbanceReaderId = NewType("AbsorbanceReaderId", str)
AbsorbanceReaderLidId = NewType("AbsorbanceReaderLidId", str)
AbsorbanceReaderMeasureMode = NewType("AbsorbanceReaderMeasureMode", str)


# todo(mm, 2024-11-08): frozen=True is getting pretty painful because ModuleStore has
# no type-safe way to modify just a single attribute. Consider unfreezing this
# (taking care to ensure that consumers of ModuleView still only get a read-only view).
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

    def raise_if_lid_status_not_expected(self, lid_on_expected: bool) -> None:
        """Raise if the lid status is not correct."""
        match = self.is_lid_on is lid_on_expected
        if not match:
            raise CannotPerformModuleAction(
                "Cannot perform lid action because the lid is already "
                f"{'closed' if self.is_lid_on else 'open'}"
            )
