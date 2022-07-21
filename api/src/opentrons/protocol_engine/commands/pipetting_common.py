"""Common pipetting command base models."""
from pydantic import BaseModel, Field

from ..types import WellLocation


class PipetteIdMixin(BaseModel):
    """Mixin for command requests that take a pipette ID."""

    pipetteId: str = Field(
        ...,
        description="Identifier of pipette to use for liquid handling.",
    )


class VolumeMixin(BaseModel):
    """Mixin for command requests that take a volume of liquid."""

    volume: float = Field(
        ...,
        description="Amount of liquid in uL. Must be greater than 0 and less "
        "than a pipette-specific maximum volume.",
        gt=0,
    )

    # todo(mm, 2021-03-26): This class or one of its subclasses should have a
    # field for liquid flow rate in microliters per second.
    # See Opentrons/opentrons#4837 for terminology concerns.


class FlowRateMixin(BaseModel):
    """Mixin for command requests that take a flow rate."""

    flowRate: float = Field(
        ..., description="Speed in µL/s configured for the pipette", gt=0
    )


class WellLocationMixin(BaseModel):
    """Mixin for command requests that take a location that's somewhere in a well."""

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


class BaseLiquidHandlingResult(BaseModel):
    """Base properties of a liquid handling result."""

    volume: float = Field(
        ...,
        description="Amount of liquid in uL handled in the operation.",
        gt=0,
    )
