"""
opentrons_shared_data.labware: types and functions for accessing labware defs
"""
import json
from typing import Any, Dict, List, NewType, Union
from typing_extensions import Literal, TypedDict

from .. import load_shared_data

Schema = NewType("Schema", Dict[str, Any])


def load_definition(loadname: str, version: int) -> "LabwareDefinition":
    return json.loads(
        load_shared_data(f"labware/definitions/2/{loadname}/{version}.json")
    )


def load_schema() -> Schema:
    return json.loads(load_shared_data("labware/schemas/2.json"))


LabwareUri = NewType("LabwareUri", str)

LabwareDisplayCategory = Union[
    Literal["tipRack"],
    Literal["tubeRack"],
    Literal["reservoir"],
    Literal["trash"],
    Literal["wellPlate"],
    Literal["aluminumBlock"],
    Literal["adapter"],
    Literal["other"],
]

LabwareFormat = Union[
    Literal["96Standard"],
    Literal["384Standard"],
    Literal["trough"],
    Literal["irregular"],
    Literal["trash"],
]

LabwareRoles = Union[
    Literal["labware"],
    Literal["fixture"],
    Literal["adapter"],
    Literal["maintenance"],
]

Circular = Literal["circular"]
Rectangular = Literal["rectangular"]
WellShape = Union[Circular, Rectangular]


class NamedOffset(TypedDict):
    x: float
    y: float
    z: float


class GripperOffsets(TypedDict):
    pickUpOffset: NamedOffset
    dropOffset: NamedOffset


class LabwareParameters(TypedDict, total=False):
    format: LabwareFormat
    isTiprack: bool
    loadName: str
    isMagneticModuleCompatible: bool
    quirks: List[str]
    tipLength: float
    tipOverlap: float
    magneticModuleEngageHeight: float


class LabwareBrandData(TypedDict, total=False):
    brand: str
    brandId: List[str]
    links: List[str]


class LabwareMetadata(TypedDict, total=False):
    displayName: str
    displayCategory: LabwareDisplayCategory
    displayVolumeUnits: Union[Literal["µL"], Literal["mL"], Literal["L"]]
    tags: List[str]


class LabwareDimensions(TypedDict):
    yDimension: float
    zDimension: float
    xDimension: float


class CircularWellDefinition(TypedDict):
    shape: Circular
    depth: float
    totalLiquidVolume: float
    x: float
    y: float
    z: float
    diameter: float


class RectangularWellDefinition(TypedDict):
    shape: Rectangular
    depth: float
    totalLiquidVolume: float
    x: float
    y: float
    z: float
    xDimension: float
    yDimension: float


WellDefinition = Union[CircularWellDefinition, RectangularWellDefinition]


class WellGroupMetadata(TypedDict, total=False):
    displayName: str
    displayCategory: LabwareDisplayCategory
    wellBottomShape: Union[Literal["flat"], Literal["u"], Literal["v"]]


class WellGroup(TypedDict, total=False):
    wells: List[str]
    metadata: WellGroupMetadata
    brand: LabwareBrandData


class _RequiredLabwareDefinition(TypedDict):
    schemaVersion: Literal[2]
    version: int
    namespace: str
    metadata: LabwareMetadata
    brand: LabwareBrandData
    parameters: LabwareParameters
    cornerOffsetFromSlot: NamedOffset
    ordering: List[List[str]]
    dimensions: LabwareDimensions
    wells: Dict[str, WellDefinition]
    groups: List[WellGroup]


class LabwareDefinition(_RequiredLabwareDefinition, total=False):
    stackingOffsetWithLabware: Dict[str, NamedOffset]
    stackingOffsetWithModule: Dict[str, NamedOffset]
    allowedRoles: List[LabwareRoles]
    gripperOffsets: Dict[str, GripperOffsets]
    gripForce: float
    gripHeightFromLabwareBottom: float
