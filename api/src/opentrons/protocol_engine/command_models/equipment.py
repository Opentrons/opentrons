"""Equipment loading command models."""
from pydantic import BaseModel, Field
from typing import Optional
from opentrons.types import Mount
from opentrons_shared_data.pipette.dev_types import PipetteName

from .command import BaseCommand


class LoadLabwareRequest(BaseModel):
    location: int = Field(
        ...,
        description="Deck slot", ge=1, lt=12)
    loadName: str = Field(
        ...,
        description="Name used to reference a labware definition")
    # TODO(mc, 2020-10-08): default this field value to None if missing
    displayName: Optional[str] = Field(
        ...,
        description="User-readable name for labware")
    namespace: str = Field(
        ...,
        description="The namespace the labware definition belongs to")
    version: int = Field(
        ...,
        description="The labware definition version")


class LoadLabwareResponse(BaseModel):
    labwareId: str


LoadLabwareCommand = BaseCommand[LoadLabwareRequest, LoadLabwareResponse]


class LoadPipetteRequest(BaseModel):
    pipetteName: PipetteName = Field(
        ...,
        description="The name of the pipette to be required")
    mount: Mount
