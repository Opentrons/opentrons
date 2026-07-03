"""Hardware peripheral's substate."""

from typing import Union

from .barcode_scanner_peripheral_substate import (
    BarcodeScannerPeripheralId,
    BarcodeScannerPeripheralSubState,
)

PeripheralSubStateType = Union[BarcodeScannerPeripheralSubState,]

__all__ = [
    "BarcodeScannerPeripheralId",
    "BarcodeScannerPeripheralSubState",
    "PeripheralSubStateType",
]
