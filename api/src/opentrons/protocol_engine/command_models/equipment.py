"""Equipment loading command models."""
from pydantic import BaseModel, Field
from typing import Any
from opentrons.types import Mount, Point
from opentrons_shared_data.pipette.dev_types import PipetteName

from .command import BaseCommand


class LoadLabwareRequest(BaseModel):
    location: int = Field(
        ...,
        description="Deck slot", ge=1, lt=12)
    loadName: str = Field(
        ...,
        description="Name used to reference a labware definition")
    namespace: str = Field(
        ...,
        description="The namespace the labware definition belongs to")
    version: int = Field(
        ...,
        description="The labware definition version")


class LoadLabwareResponse(BaseModel):
    labwareId: str
    definition: Any
    calibration: Point


class LoadPipetteRequest(BaseModel):
    pipetteName: PipetteName = Field(
        ...,
        description="The name of the pipette to be required")
    mount: Mount


class LoadPipetteResponse(BaseModel):
    pipetteId: str


LoadLabwareCommand = BaseCommand[LoadLabwareRequest, LoadLabwareResponse]
LoadPipetteCommand = BaseCommand[LoadPipetteRequest, LoadPipetteResponse]
