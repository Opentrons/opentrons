"""Common pipetting command base models."""
from opentrons_shared_data.errors import ErrorCodes
from pydantic import BaseModel, Field
from typing import Literal, Optional, Tuple, TypedDict

from opentrons.protocol_engine.errors.error_occurrence import ErrorOccurrence

from ..types import WellLocation, LiquidHandlingWellLocation, DeckPoint


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


class LiquidHandlingWellLocationMixin(BaseModel):
    """Mixin for command requests that take a location that's somewhere in a well."""

    labwareId: str = Field(
        ...,
        description="Identifier of labware to use.",
    )
    wellName: str = Field(
        ...,
        description="Name of well to use in labware.",
    )
    wellLocation: LiquidHandlingWellLocation = Field(
        default_factory=LiquidHandlingWellLocation,
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

    # todo(mm, 2024-08-02): Consider deprecating or redefining this.
    #
    # This is here because opentrons.protocol_engine needed it for internal bookkeeping
    # and, at the time, we didn't have a way to do that without adding this to the
    # public command results. Its usefulness to callers outside
    # opentrons.protocol_engine is questionable because they would need to know which
    # critical point is in play, and I think that can change depending on obscure
    # things like labware quirks.
    position: DeckPoint = Field(
        DeckPoint(x=0, y=0, z=0),
        description=(
            "The (x,y,z) coordinates of the pipette's critical point in deck space"
            " after the move was completed."
        ),
    )


class ErrorLocationInfo(TypedDict):
    """Holds a retry location for in-place error recovery."""

    retryLocation: Tuple[float, float, float]


class OverpressureError(ErrorOccurrence):
    """Returned when sensors detect an overpressure error while moving liquid.

    The pipette plunger motion is stopped at the point of the error.

    The next thing to move the plunger must account for the robot not having a valid
    estimate of its position. It should be a `home`, `unsafe/updatePositionEstimators`,
    `unsafe/dropTipInPlace`, or `unsafe/blowOutInPlace`.
    """

    isDefined: bool = True

    errorType: Literal["overpressure"] = "overpressure"

    errorCode: str = ErrorCodes.PIPETTE_OVERPRESSURE.value.code
    detail: str = ErrorCodes.PIPETTE_OVERPRESSURE.value.detail

    errorInfo: ErrorLocationInfo


class LiquidNotFoundError(ErrorOccurrence):
    """Returned when no liquid is detected during the liquid probe process/move.

    After a failed probing, the pipette returns to the process start position.
    """

    isDefined: bool = True

    errorType: Literal["liquidNotFound"] = "liquidNotFound"

    errorCode: str = ErrorCodes.PIPETTE_LIQUID_NOT_FOUND.value.code
    detail: str = ErrorCodes.PIPETTE_LIQUID_NOT_FOUND.value.detail


class TipPhysicallyAttachedError(ErrorOccurrence):
    """Returned when sensors determine that a tip remains on the pipette after a drop attempt.

    The pipette will act as if the tip was not dropped. So, you won't be able to pick
    up a new tip without dropping the current one, and movement commands will assume
    there is a tip hanging off the bottom of the pipette.
    """

    isDefined: bool = True

    errorType: Literal["tipPhysicallyAttached"] = "tipPhysicallyAttached"

    errorCode: str = ErrorCodes.TIP_DROP_FAILED.value.code
    detail: str = ErrorCodes.TIP_DROP_FAILED.value.detail
