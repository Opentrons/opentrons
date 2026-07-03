"""Protocol engine commands specific to the barcode scanner."""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from pydantic import BaseModel, Field
from typing_extensions import Literal, Type

from opentrons_shared_data.errors import ErrorCodes

from ...errors.error_occurrence import ErrorOccurrence
from ..command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
    DefinedErrorData,
    SuccessData,
)

if TYPE_CHECKING:
    from opentrons.protocol_engine.execution import EquipmentHandler
    from opentrons.protocol_engine.resources import ModelUtils
    from opentrons.protocol_engine.state.state import StateView

ScanBarcodeCommandType = Literal["barcodePeripheral/scanBarcode"]


class BarcodeScanFailureError(ErrorOccurrence):
    """Returned when the scanner is unable to decode a barcode before the timeout."""

    isDefined: bool = True
    errorType: Literal["barcodeScanFailure"] = "barcodeScanFailure"

    errorCode: str = ErrorCodes.BARCODE_SCANNER_FAILURE.value.code
    detail: str = ErrorCodes.BARCODE_SCANNER_FAILURE.value.detail


class ScanBarcodeParams(BaseModel):
    """Input parameters to start a scan session."""

    peripheralId: str = Field(..., description="Unique ID of the Barcode Scanner.")


class ScanBarcodeResult(BaseModel):
    """Result data from scan session."""

    scan_result: str


_ExecuteReturn = (
    SuccessData[ScanBarcodeResult] | DefinedErrorData[BarcodeScanFailureError]
)


class ScanBarcodeImpl(
    AbstractCommandImpl[
        ScanBarcodeParams,
        _ExecuteReturn,
    ]
):
    """Execution implementation of a Barcode scanners scan command."""

    def __init__(
        self,
        state_view: StateView,
        equipment: EquipmentHandler,
        model_utils: ModelUtils,
        **unused_dependencies: object,
    ) -> None:
        self._state_view = state_view
        self._equipment = equipment
        self._model_utils = model_utils

    async def execute(self, params: ScanBarcodeParams) -> _ExecuteReturn:
        """Start a scan session."""
        # Allow propagation of PeripheralNotLoadedError and WrongPeripheralTypeError.
        peripheral_substate = self._state_view.peripherals.get_barcode_scanner_substate(
            peripheral_id=params.peripheralId
        )

        # Allow propagation of PeripheralNotAttachedError.
        barcode_hardware = self._equipment.get_barcode_hardware_api(
            peripheral_substate.peripheral_id
        )

        if barcode_hardware is not None:
            scan_data = await barcode_hardware.scan_barcode()
        if scan_data is None:
            return DefinedErrorData(
                public=BarcodeScanFailureError(
                    id=self._model_utils.generate_id(),
                    createdAt=self._model_utils.get_timestamp(),
                )
            )
        else:
            return SuccessData(
                public=ScanBarcodeResult(scan_result=scan_data),
            )


class ScanBarcode(BaseCommand[ScanBarcodeParams, ScanBarcodeResult, ErrorOccurrence]):
    """A command to start a scan session."""

    commandType: ScanBarcodeCommandType = "barcodePeripheral/scanBarcode"

    params: ScanBarcodeParams
    result: Optional[ScanBarcodeResult] = None

    _ImplementationCls: Type[ScanBarcodeImpl] = ScanBarcodeImpl


class ScanBarcodeCreate(BaseCommandCreate[ScanBarcodeParams]):
    """A request to start a scan session."""

    commandType: ScanBarcodeCommandType = "barcodePeripheral/scanBarcode"
    params: ScanBarcodeParams

    _CommandCls: Type[ScanBarcode] = ScanBarcode
