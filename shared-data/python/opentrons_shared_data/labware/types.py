""" opentrons_shared_data.labware.types: types for labware defs

types in this file by and large require the use of typing_extensions.
this module shouldn't be imported unless typing.TYPE_CHECKING is true.
"""
from typing import Dict, List, NewType, Union, cast
from typing_extensions import Literal, TypedDict, NotRequired
from .labware_definition import (
    WellSegment as WellSegmentDef,
    InnerWellGeometry as InnerWellGeometryDef,
)
from .constants import (
    Conical,
    Pyramidal,
    SquaredCone,
    RoundedPyramid,
    Spherical,
    Circular,
    Rectangular,
    WellShape,
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


class ConicalFrustum(TypedDict):
    shape: Conical
    bottomDiameter: float
    topDiameter: float
    topHeight: float
    bottomHeight: float


class PyramidalFrustum(TypedDict):
    shape: Pyramidal
    bottomXDimension: float
    bottomYDimension: float
    topXDimension: float
    topYDimension: float
    topHeight: float
    bottomHeight: float


# A squared cone is the intersection of a cube and a cone that both
# share a central axis, and is a transitional shape between a cone and pyramid
class SquaredConeSegment(TypedDict):
    shape: SquaredCone
    bottomCrossSection: WellShape
    circleDiameter: float
    rectangleXDimension: float
    rectangleYDimension: float
    topHeight: float
    bottomHeight: float


# A rounded pyramid is a pyramid that is filleted on each corner with the following:
# for each cross section the shape is a rectangle that has its corners rounded off
# the rounding for the corner is done by taking the intersection of the rectangle and
# a circle who's center is 1 radius away in both x and y from the edge of the rectangle
# which means the two angles where the circle meets the rectangle are exactly 90 degrees
# on the "circular" side of the shape all 4 filleting circles share a common center
# at the center of the rectangle
# on the "rectangular" side of the shape the 4 circles are 0 radius
# and their centers are the exact corner of the rectangle
class RoundedPyramidSegment(TypedDict):
    shape: RoundedPyramid
    bottomCrossSection: WellShape
    circleDiameter: float
    rectangleXDimension: float
    rectangleYDimension: float
    topHeight: float
    bottomHeight: float


WellSegment = Union[
    ConicalFrustum,
    PyramidalFrustum,
    SquaredConeSegment,
    RoundedPyramidSegment,
    SphericalSegment,
]


def ToWellSegmentDict(segment: Union[WellSegment, WellSegmentDef]) -> WellSegment:
    if not isinstance(segment, dict):
        return cast(
            WellSegment, segment.model_dump(exclude_none=True, exclude_unset=True)  # type: ignore[union-attr]
        )
    return segment


class InnerWellGeometry(TypedDict):
    sections: List[WellSegment]


def ToInnerWellGeometryDict(
    inner_well_geometry: Union[InnerWellGeometry, InnerWellGeometryDef]
) -> InnerWellGeometry:
    if not isinstance(inner_well_geometry, dict):
        geometry_dict: InnerWellGeometry = {
            "sections": [
                ToWellSegmentDict(section) for section in inner_well_geometry.sections
            ]
        }
        return geometry_dict
    return inner_well_geometry


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
