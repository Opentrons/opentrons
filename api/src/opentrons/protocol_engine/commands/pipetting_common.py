"""Common pipetting command base models."""
from pydantic import BaseModel, Field

from ..types import WellLocation


class BasePipettingData(BaseModel):
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


class BaseLiquidHandlingData(BasePipettingData):
    """Base class for data payloads of commands that handle liquid."""

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

    # todo(mm, 2021-03-26): This class or one of its subclasses should have a
    # field for liquid flow rate in microliters per second.
    # See Opentrons/opentrons#4837 for terminology concerns.


class BaseLiquidHandlingResult(BaseModel):
    """Base properties of a liquid handling result."""

    volume: float = Field(
        ...,
        description="Amount of liquid in uL handled in the operation.",
        gt=0,
    )
