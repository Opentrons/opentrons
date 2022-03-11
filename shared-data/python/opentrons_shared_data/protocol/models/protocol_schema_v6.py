from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from typing_extensions import Literal
from enum import Enum
from opentrons_shared_data.labware.labware_definition import LabwareDefinition


class CommandAnnotation(BaseModel):
    commandIds: List[str]
    annotationType: str


class CornerOffsetFromSlot(BaseModel):
    x: int
    y: int
    z: int


class Location(BaseModel):
    slotName: Optional[int] = None
    moduleId: Optional[str] = None


class VolumeByWell(BaseModel):
    A1: int
    B1: int


class WellLocation(BaseModel):
    origin: Optional[str] = None
    offset: Optional[CornerOffsetFromSlot] = None


class Params(BaseModel):
    slotName: Optional[int] = None
    axes: Optional[List[str]] = None
    pipetteId: Optional[str] = None
    mount: Optional[str] = None
    moduleId: Optional[str] = None
    location: Optional[Location] = None
    labwareId: Optional[str] = None
    displayName: Optional[str] = None
    liquidId: Optional[str] = None
    volumeByWell: Optional[VolumeByWell] = None
    wellName: Optional[str] = None
    volume: Optional[float] = None
    flowRate: Optional[float] = None
    wellLocation: Optional[WellLocation] = None
    wait: Optional[int] = None
    minimumZHeight: Optional[int] = None
    forceDirect: Optional[bool] = None
    message: Optional[str] = None
    coordinates: Optional[CornerOffsetFromSlot] = None
    axis: Optional[str] = None
    distance: Optional[float] = None
    positionId: Optional[str] = None


class Command(BaseModel):
    commandType: str
    id: str
    params: Params


class Labware(BaseModel):
    displayName: Optional[str] = None
    definitionId: str


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


class A1(BaseModel):
    depth: float
    totalLiquidVolume: int
    shape: Shape
    x: float
    y: float
    z: float
    diameter: Optional[float] = None
    yDimension: Optional[float] = None
    xDimension: Optional[float] = None


class Liquids(BaseModel):
    displayName: str
    description: str


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
    model: str
    deckId: str


class ProtocolSchemaV6(BaseModel):
    otSharedSchema: Literal["#/protocol/schemas/6"] = Field(
        ...,
        alias="$otSharedSchema",
        description="The path to a valid Opentrons shared schema relative to "
        "the shared-data directory, without its extension.",
    )
    schemaVersion: Literal[6]
    metadata: Metadata
    robot: Robot
    pipettes: Dict[str, Pipette]
    modules: Optional[Dict[str, Module]] = None
    labware: Dict[str, Labware]
    liquids: Optional[Dict[str, Liquids]] = None
    labwareDefinitions: Dict[str, LabwareDefinition] = Field(
        ...,
        description="All labware definitions used by labware in this protocol, "
        "keyed by UUID",
    )
    commands: List[Command]
    commandAnnotations: Optional[List[CommandAnnotation]] = None
