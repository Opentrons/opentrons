""" opentrons_shared_data.labware.types: types for labware defs

types in this file by and large require the use of typing_extensions.
this module shouldn't be imported unless typing.TYPE_CHECKING is true.
"""
from typing import Dict, List, NewType, Union
from typing_extensions import Literal, TypedDict, NotRequired
from .labware_definition import WellSegment as WellSegmentDef
from .constants import (
    Circular,
    Rectangular,
    TruncatedCircular,
    RoundedRectangular,
    Spherical,
)

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
    geometryDefinitionId: NotRequired[str]


class RectangularWellDefinition(TypedDict):
    shape: Rectangular
    depth: float
    totalLiquidVolume: float
    x: float
    y: float
    z: float
    xDimension: float
    yDimension: float
    geometryDefinitionId: NotRequired[str]


WellDefinition = Union[CircularWellDefinition, RectangularWellDefinition]


class WellGroupMetadata(TypedDict, total=False):
    displayName: str
    displayCategory: LabwareDisplayCategory
    wellBottomShape: Union[Literal["flat"], Literal["u"], Literal["v"]]


class WellGroup(TypedDict, total=False):
    wells: List[str]
    metadata: WellGroupMetadata
    brand: LabwareBrandData


class SphericalSegment(TypedDict):
    shape: Spherical
    radiusOfCurvature: float
    topHeight: float
    bottomHeight: float


class CircularFrustum(TypedDict):
    shape: Circular
    bottomDiameter: float
    topDiameter: float
    topHeight: float
    bottomHeight: float


class RectangularFrustum(TypedDict):
    shape: Rectangular
    bottomXDimension: float
    bottomYDimension: float
    topXDimension: float
    topYDimension: float
    topHeight: float
    bottomHeight: float


# A truncated circle is a square that is trimmed at the corners by a smaller circle
#   that is concentric with the square.
class TruncatedCircularSegment(TypedDict):
    shape: TruncatedCircular
    circleDiameter: float
    rectangleXDimension: float
    rectangleYDimension: float
    topHeight: float
    bottomHeight: float


# A rounded rectangle is a rectangle that is filleted by 4 circles
#   centered somewhere along the diagonals of the rectangle
class RoundedRectangularSegment(TypedDict):
    shape: RoundedRectangular
    circleDiameter: float
    rectangleXDimension: float
    rectangleYDimension: float
    topHeight: float
    bottomHeight: float


WellSegment = Union[
    CircularFrustum,
    RectangularFrustum,
    TruncatedCircularSegment,
    RoundedRectangularSegment,
    SphericalSegment,
]

@staticmethod
def ToWellSegmentDict(segment: Union[WellSegment,WellSegmentDef]) -> WellSegment:
    if isinstance(segment, WellSegmentDef):
        return typing.cast(WellSegment, segment.model_dump(exclude_none=True, exclude_unset=True))
    return segment


class InnerWellGeometry(TypedDict):
    sections: List[WellSegment]

@staticmethod
def ToInnerWellGeometryDict(inner_well_geometry: Union[InnerWellGeometry,InnerWellGeometryDef]) -> InnerWellGeometry:
    return InnerWellGeometry([ToWellSegmentDict(section) for section in inner_well_geometry["sections"]])



class LabwareDefinition(TypedDict):
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
    stackingOffsetWithLabware: NotRequired[Dict[str, NamedOffset]]
    stackingOffsetWithModule: NotRequired[Dict[str, NamedOffset]]
    allowedRoles: NotRequired[List[LabwareRoles]]
    gripperOffsets: NotRequired[Dict[str, GripperOffsets]]
    gripForce: NotRequired[float]
    gripHeightFromLabwareBottom: NotRequired[float]
    innerLabwareGeometry: NotRequired[Dict[str, InnerWellGeometry]]
