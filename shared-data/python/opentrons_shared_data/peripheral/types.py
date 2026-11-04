"""opentrons_shared_data.peripheral.types: types requiring typing_extensions for peripherals."""

from typing import List, Literal, TypedDict, Union

SchemaV1 = Literal["1"]
SchemaVersions = Union[SchemaV1]

BarcodeScannerModel = Literal["barcodeScannerV1"]

PeripheralModel = Union[BarcodeScannerModel]


PeripheralDefinitionV1 = TypedDict(
    "PeripheralDefinitionV1",
    {
        "peripheralType": PeripheralModel,
        "displayName": str,
        "loadName": str,
        "quirks": List[str],
    },
)
