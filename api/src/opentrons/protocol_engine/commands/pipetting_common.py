"""Common pipetting command base models."""
from pydantic import BaseModel, Field

from ..types import WellLocation


class BasePipettingRequest(BaseModel):
    """Base class for pipetting requests that interact with wells."""

    pipetteId: str = Field(
        ...,
        description="Identifier of pipette to use for liquid handling.",
    )
    labwareId: str = Field(
        ...,
        description="Identifier of labware to use.",
    )
    wellName: str = Field(
        ...,
        description="Name of well to use in labware.",
    )


class BaseLiquidHandlingRequest(BasePipettingRequest):
    """Base class for liquid handling requests."""

    volume: float = Field(
        ...,
        description="Amount of liquid in uL. Must be greater than 0 and less "
                    "than a pipette-specific maximum volume.",
        gt=0,
    )
    wellLocation: WellLocation = Field(
        ...,
        description="Relative well location at which to perform the operation",
    )


class BaseLiquidHandlingResult(BaseModel):
    """Base properties of a liquid handling result."""

    volume: float = Field(
        ...,
        description="Amount of liquid in uL handled in the operation.",
        gt=0,
    )
