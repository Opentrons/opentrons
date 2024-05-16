"""Common pipetting command base models."""
from typing import Optional

from pydantic import BaseModel, Field

from ..types import DeckPoint, WellLocation


class PipetteIdMixin(BaseModel):
    """Mixin for command requests that take a pipette ID."""

    pipetteId: str = Field(
        ...,
        description="Identifier of pipette to use for liquid handling.",
    )


class AspirateVolumeMixin(BaseModel):
    """Mixin for the `volume` field of aspirate commands."""

    volume: float = Field(
        ...,
        description="The amount of liquid to aspirate, in µL."
        " Must not be greater than the remaining available amount, which depends on"
        " the pipette (see `loadPipette`), its configuration (see `configureForVolume`),"
        " the tip (see `pickUpTip`), and the amount you've aspirated so far."
        " There is some tolerance for floating point rounding errors.",
        ge=0,
    )


class DispenseVolumeMixin(BaseModel):
    """Mixin for the `volume` field of dispense commands."""

    volume: float = Field(
        ...,
        description="The amount of liquid to dispense, in µL."
        " Must not be greater than the currently aspirated volume."
        " There is some tolerance for floating point rounding errors.",
        ge=0,
    )


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


class MovementMixin(BaseModel):
    """Mixin for command requests that move a pipette."""

    minimumZHeight: Optional[float] = Field(
        None,
        description=(
            "Optional minimal Z margin in mm."
            " If this is larger than the API's default safe Z margin,"
            " it will make the arc higher. If it's smaller, it will have no effect."
        ),
    )

    forceDirect: bool = Field(
        False,
        description=(
            "If true, moving from one labware/well to another"
            " will not arc to the default safe z,"
            " but instead will move directly to the specified location."
            " This will also force the `minimumZHeight` param to be ignored."
            " A 'direct' movement is in X/Y/Z simultaneously."
        ),
    )

    speed: Optional[float] = Field(
        None,
        description=(
            "Override the travel speed in mm/s."
            " This controls the straight linear speed of motion."
        ),
    )


class BaseLiquidHandlingResult(BaseModel):
    """Base properties of a liquid handling result."""

    volume: float = Field(
        ...,
        description="Amount of liquid in uL handled in the operation.",
        ge=0,
    )


class DestinationPositionResult(BaseModel):
    """Mixin for command results that move a pipette."""

    position: DeckPoint = Field(
        DeckPoint(x=0, y=0, z=0),
        description=(
            "The (x,y,z) coordinates of the pipette's critical point in deck space"
            " after the move was completed."
        ),
    )
