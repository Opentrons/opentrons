"""opentrons_shared_data.peripheral.types: types requiring typing_extensions for peripherals."""

from typing import List, Literal, TypedDict, Union

SchemaV1 = Literal["1"]
SchemaVersions = Union[SchemaV1]

BarcodeScannerPeripheralModel = Literal["BarcodeScannerV1"]

PeripheralModel = Union[BarcodeScannerPeripheralModel]


PeripheralDefinitionV1 = TypedDict(
    "PeripheralDefinitionV1",
    {
        "displayName": str,
        "loadName": str,
        "quirks": List[str],
    },
)
