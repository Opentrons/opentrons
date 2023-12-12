from typing import Optional, List, Dict, Any
from typing_extensions import Literal
from enum import Enum
from pydantic import BaseModel


class Dimensions(BaseModel):
    xDimension: float
    yDimension: float
    zDimension: float


class GroupMetadata(BaseModel):
    pass


class Group(BaseModel):
    metadata: GroupMetadata
    wells: List[str]


class Shape(Enum):
    circular = "circular"
    rectangular = "rectangular"


class WellDefinition(BaseModel):
    depth: float
    totalLiquidVolume: int
    shape: Shape
    x: float
    y: float
    z: float
    diameter: Optional[float]
    yDimension: Optional[float]
    xDimension: Optional[float]


class Metadata(BaseModel):
    protocolName: Optional[str]
    author: Optional[str]
    description: Optional[str]
    created: Optional[int]
    lastModified: Optional[int]
    category: Optional[str]
    subcategory: Optional[str]
    tags: Optional[List[str]]


class Module(BaseModel):
    model: str


class Pipette(BaseModel):
    name: str


class Robot(BaseModel):
    model: Literal["OT-2 Standard", "OT-3 Standard"]
    deckId: str


class DesignerApplication(BaseModel):
    name: Optional[str]
    version: Optional[str]
    data: Optional[Dict[str, Any]]


class CommandAnnotation(BaseModel):
    commandIds: List[str]
    annotationType: str


class OffsetVector(BaseModel):
    x: Optional[float]
    y: Optional[float]
    z: Optional[float]


class Location(BaseModel):
    slotName: Optional[str]
    moduleId: Optional[str]
    labwareId: Optional[str]
    addressableAreaName: Optional[str]


class ProfileStep(BaseModel):
    celsius: float
    holdSeconds: float


class WellLocation(BaseModel):
    origin: Optional[str]
    offset: Optional[OffsetVector]


class Liquid(BaseModel):
    displayName: str
    description: str
    displayColor: Optional[str]


class Labware(BaseModel):
    displayName: Optional[str]
    definitionId: str


class NozzleConfigurationParams(BaseModel):
    style: str
    primaryNozzle: Optional[str]
    frontRightNozzle: Optional[str]
