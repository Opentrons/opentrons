from typing import Union

from opentrons_shared_data.util import StrEnum


class BarcodeScannerModel(StrEnum):
    BARCODE_SCANNER_V1 = "BarcodeScannerV1"


PeripheralModel = Union[BarcodeScannerModel]


class PeripheralType(StrEnum):
    BARCODE_SCANNER = "barcodeScannerType"

    @classmethod
    def from_model(cls, model: PeripheralModel) -> "PeripheralType":
        if isinstance(model, BarcodeScannerModel):
            return cls.BARCODE_SCANNER

    @classmethod
    def to_module_fixture_id(cls, peripheral_type: "PeripheralType") -> str:
        if peripheral_type == PeripheralType.BARCODE_SCANNER:
            return "BarcodeScannerV1"
        else:
            raise ValueError(
                f"Peripheral Type {peripheral_type} does not have a related fixture ID."
            )
