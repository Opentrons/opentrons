"""Barcode Scanner substate."""

from dataclasses import dataclass
from typing import NewType

from opentrons.protocol_engine.state.update_types import (
    BarcodeScannerPeripheralStateUpdate,
)

BarcodeScannerPeripheralId = NewType("BarcodeScannerPeripheralId", str)


@dataclass(frozen=True)
class BarcodeScannerPeripheralSubState:
    """Barcode Scanner peripheral-specific state.

    Provides calculations and read-only state access
    for an individual loaded Barcode Scanner.
    """

    peripheral_id: BarcodeScannerPeripheralId

    def new_from_state_change(
        self, update: BarcodeScannerPeripheralStateUpdate
    ) -> "BarcodeScannerPeripheralSubState":
        """Return a new state with the given update applied."""
        return BarcodeScannerPeripheralSubState(
            peripheral_id=self.peripheral_id,
        )
