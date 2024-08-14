"""
This was initially generated by datamodel-codegen from the labware schema in
shared-data. It's been modified by hand to be more friendly.
"""

from __future__ import annotations

from enum import Enum
from typing import TYPE_CHECKING, Dict, List, Optional, Union

from pydantic import (
    BaseModel,
    Extra,
    Field,
    conint,
    confloat,
    StrictInt,
    StrictFloat,
)
from typing_extensions import Literal

SAFE_STRING_REGEX = "^[a-z0-9._]+$"


if TYPE_CHECKING:
    _StrictNonNegativeInt = int
    _StrictNonNegativeFloat = float
else:
    _StrictNonNegativeInt = conint(strict=True, ge=0)
    _StrictNonNegativeFloat = confloat(strict=True, ge=0.0)


_Number = Union[StrictInt, StrictFloat]
"""JSON number type, written to preserve lack of decimal point.

For labware definition hashing, which is an older part of the codebase,
this ensures that Pydantic won't change `"someFloatField: 0` to
`"someFloatField": 0.0`, which would hash differently.
"""

_NonNegativeNumber = Union[_StrictNonNegativeInt, _StrictNonNegativeFloat]
"""Non-negative JSON number type, written to preserve lack of decimal point."""


class CornerOffsetFromSlot(BaseModel):
    """
    Distance from left-front-bottom corner of slot to left-front-bottom corner
     of labware bounding box. Used for labware that spans multiple slots. For
      labware that does not span multiple slots, x/y/z should all be zero.
    """

    x: _Number
    y: _Number
    z: _Number


class OverlapOffset(BaseModel):
    """
    Overlap dimensions of labware with another labware/module that it can be stacked on top of.
    """

    x: _Number
    y: _Number
    z: _Number


class OffsetVector(BaseModel):
    """
    A generic 3-D offset vector.
    """

    x: _Number
    y: _Number
    z: _Number


class GripperOffsets(BaseModel):
    """
    Offsets used when calculating coordinates for gripping labware during labware movement.
    """

    pickUpOffset: OffsetVector
    dropOffset: OffsetVector


class BrandData(BaseModel):
    brand: str = Field(..., description="Brand/manufacturer name")
    brandId: Optional[List[str]] = Field(
        None,
        description="An array of manufacture numbers pertaining to a given labware",
    )
    links: Optional[List[str]] = Field(
        None, description="URLs for manufacturer page(s)"
    )


class DisplayCategory(str, Enum):
    tipRack = "tipRack"
    tubeRack = "tubeRack"
    reservoir = "reservoir"
    trash = "trash"
    wellPlate = "wellPlate"
    aluminumBlock = "aluminumBlock"
    adapter = "adapter"
    other = "other"


class LabwareRole(str, Enum):
    labware = "labware"
    fixture = "fixture"
    adapter = "adapter"
    maintenance = "maintenance"


class Metadata(BaseModel):
    """
    Properties used for search and display
    """

    displayName: str = Field(..., description="Easy to remember name of labware")
    displayCategory: DisplayCategory = Field(
        ..., description="Label(s) used in UI to categorize labware"
    )
    displayVolumeUnits: Literal["µL", "mL", "L"] = Field(
        ..., description="Volume units for display"
    )
    tags: Optional[List[str]] = Field(
        None, description="List of descriptions for a given labware"
    )


class Parameters(BaseModel):
    """
    Internal describers used to determine pipette movement to labware
    """

    format: Literal[
        "96Standard", "384Standard", "trough", "irregular", "trash"
    ] = Field(
        ..., description="Property to determine compatibility with multichannel pipette"
    )
    quirks: Optional[List[str]] = Field(
        None,
        description="Property to classify a specific behavior this labware "
        "should have",
    )
    isTiprack: bool = Field(
        ..., description="Flag marking whether a labware is a tiprack or not"
    )
    tipLength: Optional[_NonNegativeNumber] = Field(
        None,
        description="Required if labware is tiprack, specifies length of tip"
        " from drawing or as measured with calipers",
    )
    tipOverlap: Optional[_NonNegativeNumber] = Field(
        None,
        description="Required if labware is tiprack, specifies the length of "
        "the area of the tip that overlaps the nozzle of the pipette",
    )
    loadName: str = Field(
        ...,
        description="Name used to reference a labware definition",
        regex=SAFE_STRING_REGEX,
    )
    isMagneticModuleCompatible: bool = Field(
        ...,
        description="Flag marking whether a labware is compatible by default "
        "with the Magnetic Module",
    )
    magneticModuleEngageHeight: Optional[_NonNegativeNumber] = Field(
        None, description="Distance to move magnetic module magnets to engage"
    )


class Dimensions(BaseModel):
    """
    Outer dimensions of a labware
    """

    yDimension: _NonNegativeNumber = Field(...)
    zDimension: _NonNegativeNumber = Field(...)
    xDimension: _NonNegativeNumber = Field(...)


class WellDefinition(BaseModel):
    class Config:
        extra = Extra.allow

    depth: _NonNegativeNumber = Field(...)
    x: _NonNegativeNumber = Field(
        ...,
        description="x location of center-bottom of well in reference to "
        "left-front-bottom of labware",
    )
    y: _NonNegativeNumber = Field(
        ...,
        description="y location of center-bottom of well in reference to "
        "left-front-bottom of labware",
    )
    z: _NonNegativeNumber = Field(
        ...,
        description="z location of center-bottom of well in reference to "
        "left-front-bottom of labware",
    )
    totalLiquidVolume: _NonNegativeNumber = Field(
        ..., description="Total well, tube, or tip volume in microliters"
    )
    xDimension: Optional[_NonNegativeNumber] = Field(
        None,
        description="x dimension of rectangular wells",
    )
    yDimension: Optional[_NonNegativeNumber] = Field(
        None,
        description="y dimension of rectangular wells",
    )
    diameter: Optional[_NonNegativeNumber] = Field(
        None,
        description="diameter of circular wells",
    )
    shape: Literal["rectangular", "circular"] = Field(
        ...,
        description="If 'rectangular', use xDimension and "
        "yDimension; if 'circular' use diameter",
    )


class Hemisphere(BaseModel):
    diameter: _NonNegativeNumber = Field(
        ...,
        description="diameter of bottom subsection of wells",
    )
    depth: _NonNegativeNumber = Field(
        ..., description="The depth of a hemispherical bottom of a well"
    )


class TopCrossSection(BaseModel):
    shape: Literal["rectangular", "circular"] = Field(
        ...,
        description="Shape of a cross-section of a well used to determine how "
        "to calculate area",
    )
    xDimension: Optional[_NonNegativeNumber] = Field(
        None,
        description="x dimension of a subsection of wells",
    )
    yDimension: Optional[_NonNegativeNumber] = Field(
        None,
        description="y dimension of a subsection of wells",
    )
    diameter: Optional[_NonNegativeNumber] = Field(
        None,
        description="diameter of a subsection of wells",
    )


class BoundedSection(BaseModel):
    geometry: TopCrossSection = Field(
        ...,
        description="Geometrical information needed to calculate the volume of a subsection of a well",
    )
    top_height: _NonNegativeNumber = Field(
        ...,
        description="The height at the top of a bounded subsection of a well, relative to the bottom"
        "of the well",
    )


class Metadata1(BaseModel):
    """
    Metadata specific to a grid of wells in a labware
    """

    displayName: Optional[str] = Field(
        None, description="User-readable name for the well group"
    )
    displayCategory: Optional[DisplayCategory] = Field(
        None, description="Label(s) used in UI to categorize well groups"
    )
    wellBottomShape: Optional[Literal["flat", "u", "v"]] = Field(
        None, description="Bottom shape of the well for UI purposes"
    )


class Group(BaseModel):
    wells: List[str] = Field(
        ..., description="An array of wells that contain the same metadata"
    )
    metadata: Metadata1 = Field(
        ..., description="Metadata specific to a grid of wells in a labware"
    )
    brand: Optional[BrandData] = Field(
        None, description="Brand data for the well group (e.g. for tubes)"
    )


class InnerLabwareGeometry(BaseModel):
    frusta: List[BoundedSection] = Field(
        ...,
        description="A list of all of the sections of the well that have a contiguous shape",
    )
    bottom_shape: Optional[Hemisphere] = Field(
        None, description="An optional non-frustum shape at the bottom of a well"
    )


class LabwareDefinition(BaseModel):
    schemaVersion: Literal[1, 2] = Field(
        ..., description="Which schema version a labware is using"
    )
    version: int = Field(
        ...,
        description="Version of the labware definition itself "
        "(eg myPlate v1/v2/v3). An incrementing integer",
        ge=1.0,
    )
    namespace: str = Field(..., regex=SAFE_STRING_REGEX)
    metadata: Metadata = Field(
        ..., description="Properties used for search and display"
    )
    brand: BrandData = Field(
        ...,
        description="Real-world labware that the definition is modeled "
        "from and/or compatible with",
    )
    parameters: Parameters = Field(
        ...,
        description="Internal describers used to determine pipette movement "
        "to labware",
    )
    ordering: List[List[str]] = Field(
        ...,
        description="Generated array that keeps track of how wells should be "
        "ordered in a labware",
    )
    cornerOffsetFromSlot: CornerOffsetFromSlot = Field(
        ...,
        description="Distance from left-front-bottom corner of slot to "
        "left-front-bottom corner of labware bounding box. Used for "
        "labware that spans multiple slots. For labware that does "
        "not span multiple slots, x/y/z should all be zero.",
    )
    dimensions: Dimensions = Field(..., description="Outer dimensions of a labware")
    wells: Dict[str, WellDefinition] = Field(
        ...,
        description="Unordered object of well objects with position and "
        "dimensional information",
    )
    groups: List[Group] = Field(
        ...,
        description="Logical well groupings for metadata/display purposes; "
        "changes in groups do not affect protocol execution",
    )
    allowedRoles: List[LabwareRole] = Field(
        default_factory=list,
        description="Allowed behaviors and usage of a labware in a protocol.",
    )
    stackingOffsetWithLabware: Dict[str, OverlapOffset] = Field(
        default_factory=dict,
        description="Supported labware that can be stacked upon,"
        " with overlap vector offset between both labware.",
    )
    stackingOffsetWithModule: Dict[str, OverlapOffset] = Field(
        default_factory=dict,
        description="Supported module that can be stacked upon,"
        " with overlap vector offset between labware and module.",
    )
    gripperOffsets: Dict[str, GripperOffsets] = Field(
        default_factory=dict,
        description="Offsets use when calculating coordinates for gripping labware "
        "during labware movement.",
    )
    gripHeightFromLabwareBottom: Optional[float] = Field(
        default_factory=None,
        description="The Z-height, from labware bottom, where the gripper should grip the labware.",
    )
    gripForce: Optional[float] = Field(
        default_factory=None,
        description="Force, in Newtons, with which the gripper should grip the labware.",
    )
    innerWellGeometry: Optional[InnerLabwareGeometry] = Field(
        None,
        description="A list of bounded sections describing the geometry of the inside of the wells.",
    )
