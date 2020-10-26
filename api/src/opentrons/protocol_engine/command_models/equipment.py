"""
Equipment loading command request and result models.

These models are defined using Pydantic because they are part of the public
input / output of the engine, and need validation and/or scheme generation.
"""
from pydantic import BaseModel, Field
from typing import Any, Tuple
from opentrons.types import MountType
from opentrons_shared_data.pipette.dev_types import PipetteName


class LoadLabwareRequest(BaseModel):
    """A request to load a labware into a slot."""

    location: int = Field(
        ...,
        description="Deck slot the labware should be loaded into.",
        ge=1,
        lt=12
    )
    loadName: str = Field(
        ...,
        description="Name used to reference a labware definition."
    )
    namespace: str = Field(
        ...,
        description="The namespace the labware definition belongs to."
    )
    version: int = Field(
        ...,
        description="The labware definition version."
    )


class LoadLabwareResult(BaseModel):
    """Result data for executing a LoadLabwareRequest."""

    labwareId: str = Field(
        ...,
        description="An ID to reference this labware in subsequent commands."
    )
    # TODO(mc, 2020-10-21): Don't use `Any` here (TypedDicts make Pydantic sad)
    definition: Any = Field(
        ...,
        description="The full definition data for this labware."
    )
    calibration: Tuple[float, float, float] = Field(
        ...,
        description="Calibration offset data for this labware at load time."
    )


class LoadPipetteRequest(BaseModel):
    """A request to load a pipette on to a mount."""

    pipetteName: PipetteName = Field(
        ...,
        description="The name of the pipette to be required."
    )
    mount: MountType = Field(
        ...,
        description="The mount the pipette should be present on."
    )


class LoadPipetteResult(BaseModel):
    """Result data for executing a LoadPipetteRequest."""

    pipetteId: str = Field(
        ...,
        description="An ID to reference this pipette in subsequent commands."
    )
