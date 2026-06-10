"""Protocol engine types to do with modules."""

from __future__ import annotations

from typing import (
    List,
    Literal,
    Optional,
    TypeGuard,
)

from pydantic import BaseModel, Field

from opentrons_shared_data.util import StrEnum

from opentrons.hardware_control.peripherals import (
    PeripheralModel as HardwarePeripheralModel,
)
from opentrons.hardware_control.peripherals import PeripheralType


class PeripheralModel(StrEnum):
    """All available modules' models."""

    BARCODE_SCANNER_V1 = "barcodeScannerV1"

    @classmethod
    def from_hardware(
        cls, hardware_model: HardwarePeripheralModel
    ) -> "PeripheralModel":
        """Convert from the hardware model representation."""
        return cls(hardware_model.value)

    def as_type(self) -> PeripheralType:
        """Get the PeripheralType of this model."""
        if PeripheralModel.is_barcode_scanner_peripheral_model(self):
            return PeripheralType.BARCODE_SCANNER

        assert False, f"Invalid PeripheralModel {self}"

    @classmethod
    def is_barcode_scanner_peripheral_model(
        cls, model: PeripheralModel
    ) -> TypeGuard[BarcodeScannerPeripheralModel]:
        """Whether a given model is a barcode scanner Peripheral."""
        return model in [cls.BARCODE_SCANNER_V1]


BarcodeScannerPeripheralModel = Literal[PeripheralModel.BARCODE_SCANNER_V1]


# See underlying JSON schema for documentation.
class PeripheralDefinition(BaseModel):
    """A module definition conforming to module definition schema v1."""

    otSharedSchema: str = Field(
        "peripheral/schemas/1", description="The current schema."
    )

    peripheralType: PeripheralType = Field(...)

    model: PeripheralModel = Field(...)

    displayName: str = Field(...)

    quirks: List[str] = Field(...)


class LoadedPeripheral(BaseModel):
    """A module that has been loaded."""

    id: str
    model: PeripheralModel
    serialNumber: Optional[str] = None
