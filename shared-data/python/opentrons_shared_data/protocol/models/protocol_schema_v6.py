from pydantic import BaseModel, Field, validator
from typing import Any, List, Optional, Dict
from typing_extensions import Literal
from enum import Enum
from opentrons_shared_data.labware.labware_definition import LabwareDefinition


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


class ProfileStep(BaseModel):
    celsius: float
    holdSeconds: float


class WellLocation(BaseModel):
    origin: Optional[str]
    offset: Optional[OffsetVector]


# TODO (tamar 3/15/22): split apart all the command payloads when we tackle #9583
class Params(BaseModel):
    slotName: Optional[str]
    axes: Optional[List[str]]
    pipetteId: Optional[str]
    mount: Optional[str]
    moduleId: Optional[str]
    location: Optional[Location]
    labwareId: Optional[str]
    displayName: Optional[str]
    liquidId: Optional[str]
    volumeByWell: Optional[Dict[str, Any]]
    wellName: Optional[str]
    volume: Optional[float]
    flowRate: Optional[float]
    wellLocation: Optional[WellLocation]
    waitForResume: Optional[Literal[True]]
    seconds: Optional[float]
    minimumZHeight: Optional[float]
    forceDirect: Optional[bool]
    message: Optional[str]
    coordinates: Optional[OffsetVector]
    axis: Optional[str]
    distance: Optional[float]
    positionId: Optional[str]
    temperature: Optional[float]
    celsius: Optional[float]
    blockMaxVolumeUl: Optional[float]
    rpm: Optional[float]
    height: Optional[float]
    offset: Optional[OffsetVector]
    profile: Optional[List[ProfileStep]]


class Command(BaseModel):
    commandType: str
    params: Params
    key: Optional[str]


class Labware(BaseModel):
    displayName: Optional[str]
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


class Liquid(BaseModel):
    displayName: str
    description: str
    displayColor: Optional[str]


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


class DesignerApplication(BaseModel):
    name: Optional[str]
    version: Optional[str]
    data: Optional[Dict[str, Any]]


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
    labware: Dict[str, Labware]
    modules: Optional[Dict[str, Module]]
    liquids: Optional[Dict[str, Liquid]]
    labwareDefinitions: Dict[str, LabwareDefinition]
    # commands must be after pipettes, labware, etc. for its @validator to work.
    commands: List[Command]
    commandAnnotations: Optional[List[CommandAnnotation]]
    designerApplication: Optional[DesignerApplication]

    class Config:
        # added for constructing the class with field name instead of alias
        allow_population_by_field_name = True

    @validator("commands")
    def _validate_commands(
        cls,
        value: List[Command],
        values: Dict[str, Any],
    ) -> List[Command]:
        pipette_ids = set(values["pipettes"].keys()) if "pipettes" in values else set()
        labware_ids = set(values["labware"].keys()) if "labware" in values else set()
        module_ids = (
            set(values["modules"].keys())
            if "modules" in values and values["modules"]
            else set()
        )
        liquid_ids = (
            set(values["liquids"].keys())
            if "liquids" in values and values["liquids"]
            else set()
        )

        for index, command in enumerate(value):
            if (
                command.params.pipetteId is not None
                and command.params.pipetteId not in pipette_ids
            ):
                raise ValueError(
                    f"{command.commandType} command at index {index}"
                    f" references ID {command.params.pipetteId},"
                    f" which doesn't exist."
                )
            if (
                command.params.labwareId is not None
                and command.params.labwareId not in labware_ids
            ):
                raise ValueError(
                    f"{command.commandType} command at index {index}"
                    f" references ID {command.params.labwareId},"
                    f" which doesn't exist."
                )
            if (
                command.params.moduleId is not None
                and command.params.moduleId not in module_ids
            ):
                raise ValueError(
                    f"{command.commandType} command at index {index}"
                    f" references ID {command.params.moduleId},"
                    f" which doesn't exist."
                )
            if (
                command.params.liquidId is not None
                and command.params.liquidId not in liquid_ids
            ):
                raise ValueError(
                    f"{command.commandType} command at index {index}"
                    f" references ID {command.params.liquidId},"
                    f" which doesn't exist."
                )

        return value
