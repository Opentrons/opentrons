from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from typing_extensions import Literal
from enum import Enum


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


class PipetteIDEnum(Enum):
    pipetteId = "pipetteId"


class VolumeByWell(BaseModel):
    A1: int
    B1: int


class WellLocation(BaseModel):
    origin: str
    offset: CornerOffsetFromSlot


class Params(BaseModel):
    slotName: Optional[int] = None
    axes: Optional[List[str]] = None
    pipetteId: Optional[PipetteIDEnum] = None
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


class ID(BaseModel):
    displayName: str
    definitionId: str


class Labware(BaseModel):
    trashId: ID
    tipRackId: ID
    sourcePlateId: ID
    destPlateId: ID


class ExamplePlate1_Brand(BaseModel):
    brand: str
    brandId: List[Any]


class Dimensions(BaseModel):
    xDimension: float
    yDimension: float
    zDimension: float


class GroupMetadata(BaseModel):
    pass


class Group(BaseModel):
    metadata: GroupMetadata
    wells: List[str]


class ExamplePlate1_Metadata(BaseModel):
    displayName: str
    displayCategory: str
    displayVolumeUnits: str
    tags: Optional[List[Any]] = None


class ExamplePlate1_Parameters(BaseModel):
    format: str
    quirks: List[str]
    isTiprack: bool
    isMagneticModuleCompatible: bool
    loadName: str


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


class ExamplePlate1_Wells(BaseModel):
    A1: A1
    B1: A1
    C1: A1
    D1: A1
    A2: A1
    B2: A1
    C2: A1
    D2: A1


class ExamplePlate1(BaseModel):
    ordering: List[List[str]]
    brand: ExamplePlate1_Brand
    metadata: ExamplePlate1_Metadata
    dimensions: Dimensions
    wells: ExamplePlate1_Wells
    groups: List[Group]
    parameters: ExamplePlate1_Parameters
    namespace: str
    version: int
    schemaVersion: int
    cornerOffsetFromSlot: CornerOffsetFromSlot


class OpentronsOpentrons1_Trash1100MlFixed1_Brand(BaseModel):
    brand: str


class OpentronsOpentrons1_Trash1100MlFixed1_Wells(BaseModel):
    A1: A1


class OpentronsOpentrons1_Trash1100MlFixed1(BaseModel):
    ordering: List[List[str]]
    metadata: ExamplePlate1_Metadata
    schemaVersion: int
    version: int
    namespace: str
    dimensions: Dimensions
    parameters: ExamplePlate1_Parameters
    wells: OpentronsOpentrons1_Trash1100MlFixed1_Wells
    brand: OpentronsOpentrons1_Trash1100MlFixed1_Brand
    groups: List[Group]
    cornerOffsetFromSlot: CornerOffsetFromSlot


class OpentronsOpentrons96_Tiprack10UL1_Brand(BaseModel):
    brand: str
    brandId: List[Any]
    links: List[str]


class OpentronsOpentrons96_Tiprack10UL1_Parameters(BaseModel):
    format: str
    isTiprack: bool
    tipLength: float
    tipOverlap: float
    isMagneticModuleCompatible: bool
    loadName: str


class OpentronsOpentrons96_Tiprack10UL1(BaseModel):
    ordering: List[List[str]]
    brand: OpentronsOpentrons96_Tiprack10UL1_Brand
    metadata: ExamplePlate1_Metadata
    dimensions: Dimensions
    wells: Dict[str, A1]
    groups: List[Group]
    parameters: OpentronsOpentrons96_Tiprack10UL1_Parameters
    namespace: str
    version: int
    schemaVersion: int
    cornerOffsetFromSlot: CornerOffsetFromSlot


class LabwareDefinitions(BaseModel):
    opentronsopentrons1_trash1100mlfixed1: OpentronsOpentrons1_Trash1100MlFixed1
    opentronsopentrons96_tiprack10ul1: OpentronsOpentrons96_Tiprack10UL1
    exampleplate1: ExamplePlate1


class WaterID(BaseModel):
    displayName: str
    description: str


class Liquids(BaseModel):
    waterId: WaterID


class Metadata(BaseModel):
    protocolName: str
    author: str
    description: str
    created: int
    lastModified: None
    category: None
    subcategory: None
    tags: List[str]


class ModuleID(BaseModel):
    model: str


class Modules(BaseModel):
    magneticModuleId: ModuleID
    temperatureModuleId: ModuleID


class PipetteIDClass(BaseModel):
    name: str


class Pipettes(BaseModel):
    pipetteId: PipetteIDClass


class Robot(BaseModel):
    model: str
    deckId: str


class ProtocolSchemaV6(BaseModel):
    otSharedSchema: Literal["#/protocol/schemas/6"] = Field(
        None,
        alias="$otSharedSchema",
        description="The path to a valid Opentrons shared schema relative to "
        "the shared-data directory, without its extension.",
    )
    schemaVersion: Literal[6]
    metadata: Metadata
    robot: Robot
    pipettes: Pipettes
    modules: Modules
    labware: Labware
    liquids: Liquids
    labwareDefinitions: Any
    commands: List[Command]
    commandAnnotations: List[CommandAnnotation]
