from pydantic import BaseModel, Field
from typing import Any, List, Optional, Dict, Union
from typing_extensions import Literal

from opentrons_shared_data.labware.labware_definition import LabwareDefinition

from .shared_models import (
    Liquid,
    CommandAnnotation,
    Location,
    ProfileStep,
    WellLocation,
    OffsetVector,
    Metadata,
    Robot,
    DesignerApplication,
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
    # schema v7 add-ons
    newLocation: Optional[Union[Location, Literal["offDeck"]]]
    strategy: Optional[str]
    pickUpOffset: Optional[OffsetVector]
    dropOffset: Optional[OffsetVector]
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


class Command(BaseModel):
    commandType: str
    params: Params
    key: Optional[str]


class ProtocolSchemaV7(BaseModel):
    otSharedSchema: Literal["#/protocol/schemas/7"] = Field(
        ...,
        alias="$otSharedSchema",
        description="The path to a valid Opentrons shared schema relative to "
        "the shared-data directory, without its extension.",
    )
    schemaVersion: Literal[7]
    metadata: Metadata
    robot: Robot
    liquids: Optional[Dict[str, Liquid]]
    labwareDefinitions: Dict[str, LabwareDefinition]
    commands: List[Command]
    commandAnnotations: Optional[List[CommandAnnotation]]
    designerApplication: Optional[DesignerApplication]

    class Config:
        # added for constructing the class with field name instead of alias
        allow_population_by_field_name = True
