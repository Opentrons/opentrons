"""Python shared data models for liquid class definitions."""

from enum import Enum
from typing import TYPE_CHECKING, Literal, Union, Optional, Dict, Any, Sequence

from pydantic import (
    BaseModel,
    validator,
    Field,
    conint,
    confloat,
    StrictInt,
    StrictFloat,
)


if TYPE_CHECKING:
    _StrictNonNegativeInt = int
    _StrictNonNegativeFloat = float
else:
    _StrictNonNegativeInt = conint(strict=True, ge=0)
    _StrictNonNegativeFloat = confloat(strict=True, ge=0.0)


_Number = Union[StrictInt, StrictFloat]
"""JSON number type, written to preserve lack of decimal point"""

_NonNegativeNumber = Union[_StrictNonNegativeInt, _StrictNonNegativeFloat]
"""Non-negative JSON number type, written to preserve lack of decimal point."""

LiquidHandlingPropertyByVolume = Dict[str, _NonNegativeNumber]
"""Settings for liquid class settings keyed by target aspiration/dispense volume."""


class PositionReference(Enum):
    """Positional reference for liquid handling operations."""

    WELL_BOTTOM = "well-bottom"
    WELL_TOP = "well-top"
    WELL_CENTER = "well-center"
    LIQUID_MENISCUS = "liquid-meniscus"


class BlowoutLocation(Enum):
    """Location for blowout during a transfer function."""

    SOURCE = "source"
    DESTINATION = "destination"
    TRASH = "trash"


class Coordinate(BaseModel):
    """Three-dimensional coordinates."""

    x: _Number
    y: _Number
    z: _Number


class DelayParams(BaseModel):
    """Parameters for delay."""

    duration: _NonNegativeNumber = Field(
        ..., description="Duration of delay, in seconds."
    )


class DelayProperties(BaseModel):
    """Shared properties for delay.."""

    enable: bool = Field(..., description="Whether delay is enabled.")
    params: Optional[DelayParams] = Field(
        None, description="Parameters for the delay function."
    )

    @validator("params")
    def _validate_params(
        cls, v: Optional[DelayParams], values: Dict[str, Any]
    ) -> Optional[DelayParams]:
        if v is None and values["enable"]:
            raise ValueError("If enable is true parameters for delay must be defined.")
        return v


class TouchTipParams(BaseModel):
    """Parameters for touch-tip."""

    zOffset: _Number = Field(
        ...,
        description="Offset from the top of the well for touch-tip, in millimeters.",
    )
    mmToEdge: _Number = Field(
        ..., description="Offset away from the the well edge, in millimeters."
    )
    speed: _NonNegativeNumber = Field(
        ..., description="Touch-tip speed, in millimeters per second."
    )


class TouchTipProperties(BaseModel):
    """Shared properties for the touch-tip function."""

    enable: bool = Field(..., description="Whether touch-tip is enabled.")
    params: Optional[TouchTipParams] = Field(
        None, description="Parameters for the touch-tip function."
    )

    @validator("params")
    def _validate_params(
        cls, v: Optional[TouchTipParams], values: Dict[str, Any]
    ) -> Optional[TouchTipParams]:
        if v is None and values["enable"]:
            raise ValueError(
                "If enable is true parameters for touch tip must be defined."
            )
        return v


class MixParams(BaseModel):
    """Parameters for mix."""

    repetitions: _StrictNonNegativeInt = Field(
        ..., description="Number of mixing repetitions."
    )
    volume: _Number = Field(..., description="Volume used for mixing, in microliters.")


class MixProperties(BaseModel):
    """Mixing properties."""

    enable: bool = Field(..., description="Whether mix is enabled.")
    params: Optional[MixParams] = Field(
        None, description="Parameters for the mix function."
    )

    @validator("params")
    def _validate_params(
        cls, v: Optional[MixParams], values: Dict[str, Any]
    ) -> Optional[MixParams]:
        if v is None and values["enable"]:
            raise ValueError("If enable is true parameters for mix must be defined.")
        return v


class BlowoutParams(BaseModel):
    """Parameters for blowout."""

    location: BlowoutLocation = Field(
        ..., description="Location well or trash entity for blow out."
    )
    flowRate: _NonNegativeNumber = Field(
        ..., description="Flow rate for blow out, in microliters per second."
    )


class BlowoutProperties(BaseModel):
    """Blowout properties."""

    enable: bool = Field(..., description="Whether blow-out is enabled.")
    params: Optional[BlowoutParams] = Field(
        None, description="Parameters for the blowout function."
    )

    @validator("params")
    def _validate_params(
        cls, v: Optional[BlowoutParams], values: Dict[str, Any]
    ) -> Optional[BlowoutParams]:
        if v is None and values["enable"]:
            raise ValueError(
                "If enable is true parameters for blowout must be defined."
            )
        return v


class Submerge(BaseModel):
    """Shared properties for the submerge function before aspiration or dispense."""

    positionReference: PositionReference = Field(
        ..., description="Position reference for submerge."
    )
    offset: Coordinate = Field(..., description="Relative offset for submerge.")
    speed: _NonNegativeNumber = Field(
        ..., description="Speed of submerging, in millimeters per second."
    )
    delay: DelayProperties = Field(..., description="Delay settings for submerge.")


class RetractAspirate(BaseModel):
    """Shared properties for the retract function after aspiration."""

    positionReference: PositionReference = Field(
        ..., description="Position reference for retract after aspirate."
    )
    offset: Coordinate = Field(
        ..., description="Relative offset for retract after aspirate."
    )
    speed: _NonNegativeNumber = Field(
        ..., description="Speed of retraction, in millimeters per second."
    )
    airGapByVolume: LiquidHandlingPropertyByVolume = Field(
        ..., description="Settings for air gap keyed by target aspiration volume."
    )
    touchTip: TouchTipProperties = Field(
        ..., description="Touch tip settings for retract after aspirate."
    )
    delay: DelayProperties = Field(
        ..., description="Delay settings for retract after aspirate."
    )


class RetractDispense(BaseModel):
    """Shared properties for the retract function after dispense."""

    positionReference: PositionReference = Field(
        ..., description="Position reference for retract after dispense."
    )
    offset: Coordinate = Field(
        ..., description="Relative offset for retract after dispense."
    )
    speed: _NonNegativeNumber = Field(
        ..., description="Speed of retraction, in millimeters per second."
    )
    airGapByVolume: LiquidHandlingPropertyByVolume = Field(
        ..., description="Settings for air gap keyed by target aspiration volume."
    )
    blowout: BlowoutProperties = Field(
        ..., description="Blowout properties for retract after dispense."
    )
    touchTip: TouchTipProperties = Field(
        ..., description="Touch tip settings for retract after dispense."
    )
    delay: DelayProperties = Field(
        ..., description="Delay settings for retract after dispense."
    )


class AspirateProperties(BaseModel):
    """Properties specific to the aspirate function."""

    submerge: Submerge = Field(..., description="Submerge settings for aspirate.")
    retract: RetractAspirate = Field(
        ..., description="Pipette retract settings after an aspirate."
    )
    positionReference: PositionReference = Field(
        ..., description="Position reference for aspiration."
    )
    offset: Coordinate = Field(..., description="Relative offset for aspiration.")
    flowRateByVolume: LiquidHandlingPropertyByVolume = Field(
        ...,
        description="Settings for flow rate keyed by target aspiration volume.",
    )
    preWet: bool = Field(..., description="Whether to perform a pre-wet action.")
    mix: MixProperties = Field(
        ..., description="Mixing settings for before an aspirate"
    )
    delay: DelayProperties = Field(..., description="Delay settings after an aspirate")


class SingleDispenseProperties(BaseModel):
    """Properties specific to the single-dispense function."""

    submerge: Submerge = Field(
        ..., description="Submerge settings for single dispense."
    )
    retract: RetractDispense = Field(
        ..., description="Pipette retract settings after a single dispense."
    )
    positionReference: PositionReference = Field(
        ..., description="Position reference for single dispense."
    )
    offset: Coordinate = Field(..., description="Relative offset for single dispense.")
    flowRateByVolume: LiquidHandlingPropertyByVolume = Field(
        ...,
        description="Settings for flow rate keyed by target dispense volume.",
    )
    mix: MixProperties = Field(..., description="Mixing settings for after a dispense")
    pushOutByVolume: LiquidHandlingPropertyByVolume = Field(
        ..., description="Settings for pushout keyed by target dispense volume."
    )
    delay: DelayProperties = Field(..., description="Delay after dispense, in seconds.")


class MultiDispenseProperties(BaseModel):
    """Properties specific to the multi-dispense function."""

    submerge: Submerge = Field(..., description="Submerge settings for multi-dispense.")
    retract: RetractDispense = Field(
        ..., description="Pipette retract settings after a multi-dispense."
    )
    positionReference: PositionReference = Field(
        ..., description="Position reference for multi-dispense."
    )
    offset: Coordinate = Field(
        ..., description="Relative offset for single multi-dispense."
    )
    flowRateByVolume: LiquidHandlingPropertyByVolume = Field(
        ...,
        description="Settings for flow rate keyed by target dispense volume.",
    )
    conditioningByVolume: LiquidHandlingPropertyByVolume = Field(
        ...,
        description="Settings for conditioning volume keyed by target dispense volume.",
    )
    disposalByVolume: LiquidHandlingPropertyByVolume = Field(
        ..., description="Settings for disposal volume keyed by target dispense volume."
    )
    delay: DelayProperties = Field(
        ..., description="Delay settings after each dispense"
    )


class ByTipTypeSetting(BaseModel):
    """Settings for each kind of tip this pipette can use."""

    tiprack: str = Field(
        ...,
        description="The name of tiprack whose tip will be used when handling this specific liquid class with this pipette",
    )
    aspirate: AspirateProperties = Field(
        ..., description="Aspirate parameters for this tip type."
    )
    singleDispense: SingleDispenseProperties = Field(
        ..., description="Single dispense parameters for this tip type."
    )
    multiDispense: Optional[MultiDispenseProperties] = Field(
        None, description="Optional multi-dispense parameters for this tip type."
    )


class ByPipetteSetting(BaseModel):
    """The settings for this liquid class when used with a specific kind of pipette."""

    pipetteModel: str = Field(..., description="The pipette model this applies to.")
    byTipType: Sequence[ByTipTypeSetting] = Field(
        ..., description="Settings for each kind of tip this pipette can use"
    )


class LiquidClassSchemaV1(BaseModel):
    """Defines a single liquid class's properties for liquid handling functions."""

    liquidClassName: str = Field(
        ..., description="The name of the liquid (e.g., water, ethanol, serum)."
    )
    displayName: str = Field(..., description="User-readable name of the liquid class.")
    schemaVersion: Literal[1] = Field(
        ..., description="Which schema version a liquid class is using"
    )
    namespace: str = Field(...)
    byPipette: Sequence[ByPipetteSetting] = Field(
        ...,
        description="Liquid class settings by each pipette compatible with this liquid class.",
    )
