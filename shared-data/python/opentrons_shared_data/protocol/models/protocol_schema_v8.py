from pydantic import BaseModel, Field, Extra
from typing import Any, List, Optional, Dict, Union
from typing_extensions import Literal

from opentrons_shared_data.labware.labware_definition import LabwareDefinition

from .shared_models import (
    Liquid,
    Location,
    ProfileStep,
    WellLocation,
    OffsetVector,
    Metadata,
    DesignerApplication,
    Robot,
    NozzleConfigurationParams,
)


# TODO (tamar 3/15/22): split apart all the command payloads when we tackle #9583
class Params(BaseModel):
    slotName: Optional[str]
    axes: Optional[List[str]]
    pipetteId: Optional[str]
    mount: Optional[str]
    moduleId: Optional[str]
    location: Optional[Union[Location, Literal["offDeck"]]]
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
    speed: Optional[float]
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
    radius: Optional[float]
    newLocation: Optional[Union[Location, Literal["offDeck"]]]
    strategy: Optional[str]
    # schema v7 add-ons
    homeAfter: Optional[bool]
    alternateDropLocation: Optional[bool]
    holdTimeSeconds: Optional[float]
    maintenancePosition: Optional[str]
    pipetteName: Optional[str]
    model: Optional[str]
    loadName: Optional[str]
    namespace: Optional[str]
    version: Optional[int]
    pushOut: Optional[float]
    pickUpOffset: Optional[OffsetVector]
    dropOffset: Optional[OffsetVector]
    # schema v8 add-ons
    addressableAreaName: Optional[str]
    configurationParams: Optional[NozzleConfigurationParams]
    stayAtHighestPossibleZ: Optional[bool]


class Command(BaseModel):
    commandType: str
    params: Params
    key: Optional[str]


class CommandAnnotation(BaseModel):
    commandKeys: List[str]
    annotationType: str

    class Config:
        extra = Extra.allow


class ProtocolSchemaV8(BaseModel):
    otSharedSchema: Literal["#/protocol/schemas/8"] = Field(
        ...,
        alias="$otSharedSchema",
        description="The path to a valid Opentrons shared schema relative to "
        "the shared-data directory, without its extension.",
    )
    schemaVersion: Literal[8]
    metadata: Metadata
    robot: Robot
    liquidSchemaId: Literal["opentronsLiquidSchemaV1"]
    liquids: Dict[str, Liquid]
    labwareDefinitionSchemaId: Literal["opentronsLabwareSchemaV2"]
    labwareDefinitions: Dict[str, LabwareDefinition]
    commandSchemaId: Literal["opentronsCommandSchemaV8", "opentronsCommandSchemaV9"]
    commands: List[Command]
    commandAnnotationSchemaId: Literal["opentronsCommandAnnotationSchemaV1"]
    commandAnnotations: List[CommandAnnotation]
    designerApplication: Optional[DesignerApplication]

    class Config:
        # added for constructing the class with field name instead of alias
        allow_population_by_field_name = True
