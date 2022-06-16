"""Common pipetting command base models."""
from pydantic import BaseModel, Field

from ..types import WellLocation


class BasePipettingParams(BaseModel):
    """Base class for data payloads of commands that interact with wells."""

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
    wellLocation: WellLocation = Field(
        default_factory=WellLocation,
        description="Relative well location at which to perform the operation",
    )


class BaseLiquidHandlingParams(BasePipettingParams):
    """Base class for data payloads of commands that handle liquid."""

    volume: float = Field(
        ...,
        description="Amount of liquid in uL. Must be greater than 0 and less "
        "than a pipette-specific maximum volume.",
        gt=0,
    )

    # todo blow out also needs this, but uses BasePipettingParams. Need to probably make another subclass
    flowRate: float = Field(..., description="Speed in uL/s configured for the pipette", gt=0)


class BaseLiquidHandlingResult(BaseModel):
    """Base properties of a liquid handling result."""

    volume: float = Field(
        ...,
        description="Amount of liquid in uL handled in the operation.",
        gt=0,
    )
