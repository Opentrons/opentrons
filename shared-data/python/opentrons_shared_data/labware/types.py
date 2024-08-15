""" opentrons_shared_data.labware.types: types for labware defs

types in this file by and large require the use of typing_extensions.
this module shouldn't be imported unless typing.TYPE_CHECKING is true.
"""
from typing import Dict, List, NewType, Union
from typing_extensions import Literal, TypedDict, NotRequired


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
Spherical = Literal["spherical"]
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
    geometryDefinitionIndex: NotRequired[int]


class RectangularWellDefinition(TypedDict):
    shape: Rectangular
    depth: float
    totalLiquidVolume: float
    x: float
    y: float
    z: float
    xDimension: float
    yDimension: float
    geometryDefinitionIndex: NotRequired[int]


WellDefinition = Union[CircularWellDefinition, RectangularWellDefinition]


class WellGroupMetadata(TypedDict, total=False):
    displayName: str
    displayCategory: LabwareDisplayCategory
    wellBottomShape: Union[Literal["flat"], Literal["u"], Literal["v"]]


class WellGroup(TypedDict, total=False):
    wells: List[str]
    metadata: WellGroupMetadata
    brand: LabwareBrandData


class CircularCrossSection(TypedDict):
    shape: Circular
    diameter: float


class RectangularCrossSection(TypedDict):
    shape: Rectangular
    xDimension: float
    yDimension: float


class SphericalSegment(TypedDict):
    shape: Spherical
    radius_of_curvature: float
    depth: float


TopCrossSection = Union[CircularCrossSection, RectangularCrossSection]
BottomShape = Union[CircularCrossSection, RectangularCrossSection, SphericalSegment]


class BoundedSection(TypedDict):
    geometry: TopCrossSection
    topHeight: float


class InnerLabwareGeometry(TypedDict):
    frusta: List[BoundedSection]
    bottomShape: BottomShape


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
    innerWellGeometry: NotRequired[List[InnerLabwareGeometry]]
