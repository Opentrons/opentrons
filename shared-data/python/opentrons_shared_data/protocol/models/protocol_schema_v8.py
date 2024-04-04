from pydantic import ConfigDict, BaseModel, Field
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
    slotName: Optional[str] = None
    axes: Optional[List[str]] = None
    pipetteId: Optional[str] = None
    mount: Optional[str] = None
    moduleId: Optional[str] = None
    location: Optional[Union[Location, Literal["offDeck"]]] = None
    labwareId: Optional[str] = None
    displayName: Optional[str] = None
    liquidId: Optional[str] = None
    volumeByWell: Optional[Dict[str, Any]] = None
    wellName: Optional[str] = None
    volume: Optional[float] = None
    flowRate: Optional[float] = None
    wellLocation: Optional[WellLocation] = None
    waitForResume: Optional[Literal[True]] = None
    seconds: Optional[float] = None
    minimumZHeight: Optional[float] = None
    forceDirect: Optional[bool] = None
    speed: Optional[float] = None
    message: Optional[str] = None
    coordinates: Optional[OffsetVector] = None
    axis: Optional[str] = None
    distance: Optional[float] = None
    positionId: Optional[str] = None
    temperature: Optional[float] = None
    celsius: Optional[float] = None
    blockMaxVolumeUl: Optional[float] = None
    rpm: Optional[float] = None
    height: Optional[float] = None
    offset: Optional[OffsetVector] = None
    profile: Optional[List[ProfileStep]] = None
    radius: Optional[float] = None
    newLocation: Optional[Union[Location, Literal["offDeck"]]] = None
    strategy: Optional[str] = None
    # schema v7 add-ons
    homeAfter: Optional[bool] = None
    alternateDropLocation: Optional[bool] = None
    holdTimeSeconds: Optional[float] = None
    maintenancePosition: Optional[str] = None
    pipetteName: Optional[str] = None
    model: Optional[str] = None
    loadName: Optional[str] = None
    namespace: Optional[str] = None
    version: Optional[int] = None
    pushOut: Optional[float] = None
    pickUpOffset: Optional[OffsetVector] = None
    dropOffset: Optional[OffsetVector] = None
    # schema v8 add-ons
    addressableAreaName: Optional[str] = None
    configurationParams: Optional[NozzleConfigurationParams] = None
    stayAtHighestPossibleZ: Optional[bool] = None


class Command(BaseModel):
    commandType: str
    params: Params
    key: Optional[str] = None


class CommandAnnotation(BaseModel):
    commandKeys: List[str]
    annotationType: str
    model_config = ConfigDict(extra="allow")


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
    commandSchemaId: Literal["opentronsCommandSchemaV8"]
    commands: List[Command]
    commandAnnotationSchemaId: Literal["opentronsCommandAnnotationSchemaV1"]
    commandAnnotations: List[CommandAnnotation]
    designerApplication: Optional[DesignerApplication] = None
    model_config = ConfigDict(populate_by_name=True)
