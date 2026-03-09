"""Python shared data models for liquid class definitions."""

from enum import Enum
from typing import Any, Literal, Optional, Sequence, Tuple, Type, Union

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StrictBool,
    StrictFloat,
    StrictInt,
    ValidationInfo,
    field_validator,
    model_validator,
)
from pydantic.json_schema import SkipJsonSchema
from typing_extensions import Annotated

_StrictNonNegativeInt = Annotated[int, Field(strict=True, ge=0)]
_StrictGreaterThanZeroInt = Annotated[int, Field(strict=True, gt=0)]
_StrictGreaterThanZeroFloat = Annotated[float, Field(strict=True, gt=0.0)]
_StrictNonNegativeFloat = Annotated[float, Field(strict=True, ge=0.0)]


_Number = Union[StrictInt, StrictFloat]
"""JSON number type, written to preserve lack of decimal point"""

_NonNegativeNumber = Union[_StrictNonNegativeInt, _StrictNonNegativeFloat]
"""Non-negative JSON number type, written to preserve lack of decimal point."""

_GreaterThanZeroNumber = Union[_StrictGreaterThanZeroInt, _StrictGreaterThanZeroFloat]

LiquidHandlingPropertyByVolume = Sequence[Tuple[_NonNegativeNumber, _NonNegativeNumber]]
"""Settings for liquid class settings that are interpolated by volume."""

CorrectionByVolume = Sequence[Tuple[_NonNegativeNumber, _Number]]
"""Settings for correctionByVolume, which unlike other `byVolume` properties allows negative values with volume."""


def _remove_default(s: dict[str, Any]) -> None:
    s.pop("default")


# Make sure these always match the values in the Enums below
POSITION_REFERENCE_VALUE_TYPE = Literal[
    "well-bottom", "well-top", "well-center", "liquid-meniscus"
]
"""Values for positionReference."""

BLOWOUT_LOCATION_VALUE_TYPE = Literal["source", "destination", "trash"]


# Make sure the values of these Enums always match the Literals above
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


class BaseLiquidClassModel(BaseModel):
    """Base class for liquid class definitions."""

    model_config = ConfigDict(populate_by_name=True, extra="forbid")


class Coordinate(BaseLiquidClassModel):
    """Three-dimensional coordinates."""

    x: _Number
    y: _Number
    z: _Number


class TipPosition(BaseLiquidClassModel):
    """Properties for tip position reference and relative offset."""

    positionReference: PositionReference = Field(
        ...,
        alias="position_reference",
        description="Position reference for tip position.",
    )
    offset: Coordinate = Field(
        ..., description="Relative offset from position reference."
    )


class DelayParams(BaseLiquidClassModel):
    """Parameters for delay."""

    duration: _NonNegativeNumber = Field(
        ..., description="Duration of delay, in seconds."
    )


class DelayProperties(BaseLiquidClassModel):
    """Shared properties for delay."""

    enable: StrictBool = Field(..., description="Whether delay is enabled.")
    params: DelayParams | SkipJsonSchema[None] = Field(
        None,
        description="Parameters for the delay function.",
        json_schema_extra=_remove_default,
    )

    @model_validator(mode="before")
    @classmethod
    def reshape(cls, data: Any) -> Any:
        """Move any params specified as top-level keys into the 'params' value."""
        if isinstance(data, dict):
            if None not in (data.get("enable"), data.get("enabled")):
                raise ValueError(
                    "Delay properties should specify either 'enable' or 'enabled', not both."
                )
            if data.get("enabled") is not None:
                data["enable"] = data["enabled"]
                data.pop("enabled")
            if "duration" in data.keys():
                if data.get("params"):
                    raise ValueError(
                        "Delay properties should specify either duration or params, not both."
                    )
                data["params"] = DelayParams(duration=data["duration"])
                data.pop("duration")
        return data

    @field_validator("params")
    @classmethod
    def _validate_params(
        cls, v: Optional[DelayParams], info: ValidationInfo
    ) -> Optional[DelayParams]:
        if v is None and info.data.get("enable", False):
            raise ValueError("If enable is true parameters for delay must be defined.")
        return v


class LiquidClassTouchTipParams(BaseLiquidClassModel):
    """Parameters for touch-tip."""

    # Note: Do not call this `TouchTipParams`, because that class name is used by the
    # unrelated touchTip command in PE. Both classes are exported to things like the
    # command schema JSON files, so the classes can't have the same name.

    zOffset: _Number = Field(
        ...,
        alias="z_offset",
        description="Offset from the top of the well for touch-tip, in millimeters.",
    )
    mmFromEdge: _Number = Field(
        ...,
        alias="mm_from_edge",
        description="Offset away from the the well edge, in millimeters.",
    )
    speed: _GreaterThanZeroNumber = Field(
        ..., alias="speed", description="Touch-tip speed, in millimeters per second."
    )


class TouchTipProperties(BaseLiquidClassModel):
    """Shared properties for the touch-tip function."""

    enable: StrictBool = Field(..., description="Whether touch-tip is enabled.")
    params: LiquidClassTouchTipParams | SkipJsonSchema[None] = Field(
        None,
        description="Parameters for the touch-tip function.",
        json_schema_extra=_remove_default,
    )

    @model_validator(mode="before")
    @classmethod
    def reshape(cls, data: Any) -> Any:
        """Move any params specified as top-level keys into the 'params' value."""
        return reshape_glob(
            data=data,
            params_model=LiquidClassTouchTipParams,
            property_name="Touch tip properties",
        )

    @field_validator("params")
    @classmethod
    def _validate_params(
        cls, v: Optional[LiquidClassTouchTipParams], info: ValidationInfo
    ) -> Optional[LiquidClassTouchTipParams]:
        if v is None and info.data.get("enable", False):
            raise ValueError(
                "If enable is true parameters for touch tip must be defined."
            )
        return v


class MixParams(BaseLiquidClassModel):
    """Parameters for mix."""

    repetitions: _StrictNonNegativeInt = Field(
        ...,
        alias="repetitions",
        description="Number of mixing repetitions. 0 is valid, but no mixing will occur.",
    )
    volume: _GreaterThanZeroNumber = Field(
        ..., alias="volume", description="Volume used for mixing, in microliters."
    )


class MixProperties(BaseLiquidClassModel):
    """Mixing properties."""

    enable: StrictBool = Field(..., description="Whether mix is enabled.")
    params: MixParams | SkipJsonSchema[None] = Field(
        None,
        description="Parameters for the mix function.",
        json_schema_extra=_remove_default,
    )

    @model_validator(mode="before")
    @classmethod
    def reshape(cls, data: Any) -> Any:
        """Move any params specified as top-level keys into the 'params' value."""
        return reshape_glob(
            data=data, params_model=MixParams, property_name="Mix properties"
        )

    @field_validator("params")
    @classmethod
    def _validate_params(
        cls, v: Optional[MixParams], info: ValidationInfo
    ) -> Optional[MixParams]:
        if v is None and info.data.get("enable", False):
            raise ValueError("If enable is true parameters for mix must be defined.")
        return v


class BlowoutParams(BaseLiquidClassModel):
    """Parameters for blowout."""

    location: BlowoutLocation = Field(
        ..., alias="location", description="Location well or trash entity for blow out."
    )
    flowRate: _GreaterThanZeroNumber = Field(
        ...,
        alias="flow_rate",
        description="Flow rate for blow out, in microliters per second.",
    )
    blowoutPosition: Optional[TipPosition] | SkipJsonSchema[None] = Field(
        None,
        alias="blowout_position",
        description="Position of the tip during blowout.",
        json_schema_extra=_remove_default,
    )


class BlowoutProperties(BaseLiquidClassModel):
    """Blowout properties."""

    enable: StrictBool = Field(..., description="Whether blow-out is enabled.")
    params: BlowoutParams | SkipJsonSchema[None] = Field(
        None,
        description="Parameters for the blowout function.",
        json_schema_extra=_remove_default,
    )

    @model_validator(mode="before")
    @classmethod
    def reshape(cls, data: Any) -> Any:
        """Move any params specified as top-level keys into the 'params' value."""
        return reshape_glob(
            data=data, params_model=BlowoutParams, property_name="Blowout properties"
        )

    @field_validator("params")
    @classmethod
    def _validate_params(
        cls, v: Optional[BlowoutParams], info: ValidationInfo
    ) -> Optional[BlowoutParams]:
        if v is None and info.data.get("enable", False):
            raise ValueError(
                "If enable is true parameters for blowout must be defined."
            )
        return v


def reshape_glob(
    data: Any,
    params_model: Type[
        Union[LiquidClassTouchTipParams, BlowoutParams, DelayParams, MixParams]
    ],
    property_name: str,
) -> Any:
    """Move any params specified as top-level keys into the 'params' value.

    Also move value of 'enabled' key into 'enable' key.
    """
    # NOTE: This does not check that the input dictionary is strictly in the shape of
    # a TransferPropertiesDict. Specifically, it doesn't check that it receives the
    # 'enabled' key when params are specified as top-level keys. So something like this
    # dict will still convert successfully- {'enable': True, 'repetitions': 1, 'volume': 1}
    # To conform to TransferPropertiesDict, the enable key should be 'enabled'.
    # I am allowing this since it still can be converted to a valid LC params model.

    if isinstance(data, dict):
        if None not in (data.get("enable"), data.get("enabled")):
            raise ValueError(
                f"{property_name} should specify either 'enable' or 'enabled', not both."
            )
        if data.get("enabled") is not None:
            data["enable"] = data["enabled"]
            data.pop("enabled")

        params_list = [
            meta.alias for field, meta in params_model.model_fields.items()
        ]  # List of all params in the *model*, including optional ones
        required_params = [
            meta.alias
            for field, meta in params_model.model_fields.items()
            if meta.is_required()
        ]  # List of strictly required params

        # List of booleans specifying if each required param is present in the data
        required_params_in_data = [param in data.keys() for param in required_params]
        if any(required_params_in_data):
            if not all(required_params_in_data):
                raise ValueError(
                    f"{property_name} should specify either all of the params-"
                    f"{required_params} - or none of them."
                )
            if data.get("params"):
                raise ValueError(
                    f"{property_name} should specify either all of"
                    f" {required_params} or 'params', not both."
                )
            # Get a list of the required params + the optional params in the data.
            # Then move them all under a new "params" key.
            # This list purposely skips any extra, non-param keys present in the data so that the model validator
            # can raise a validation error upon encountering the unexpected keys.
            all_params_in_data = [
                param
                for param in params_list
                if param in required_params
                or (param not in required_params and data.get(param) is not None)
            ]
            data["params"] = params_model.model_validate(
                {param: data[param] for param in all_params_in_data}
            )
            # Remove the params from the data dict
            for param in all_params_in_data:
                data.pop(param)
    return data


class Submerge(BaseLiquidClassModel):
    """Shared properties for the submerge function before aspiration or dispense."""

    startPosition: TipPosition = Field(
        ...,
        alias="start_position",
        description="Tip position before starting the submerge.",
    )
    speed: _NonNegativeNumber = Field(
        ..., description="Speed of submerging, in millimeters per second."
    )
    delay: DelayProperties = Field(..., description="Delay settings for submerge.")


class RetractAspirate(BaseLiquidClassModel):
    """Shared properties for the retract function after aspiration."""

    endPosition: TipPosition = Field(
        ..., alias="end_position", description="Tip position at the end of the retract."
    )
    speed: _NonNegativeNumber = Field(
        ..., description="Speed of retraction, in millimeters per second."
    )
    airGapByVolume: LiquidHandlingPropertyByVolume = Field(
        ...,
        alias="air_gap_by_volume",
        description="Settings for air gap keyed by target aspiration volume.",
    )
    touchTip: TouchTipProperties = Field(
        ...,
        alias="touch_tip",
        description="Touch tip settings for retract after aspirate.",
    )
    delay: DelayProperties = Field(
        ..., description="Delay settings for retract after aspirate."
    )


class RetractDispense(BaseLiquidClassModel):
    """Shared properties for the retract function after dispense."""

    endPosition: TipPosition = Field(
        ..., alias="end_position", description="Tip position at the end of the retract."
    )
    speed: _NonNegativeNumber = Field(
        ..., description="Speed of retraction, in millimeters per second."
    )
    airGapByVolume: LiquidHandlingPropertyByVolume = Field(
        ...,
        alias="air_gap_by_volume",
        description="Settings for air gap keyed by target aspiration volume.",
    )
    blowout: BlowoutProperties = Field(
        ..., description="Blowout properties for retract after dispense."
    )
    touchTip: TouchTipProperties = Field(
        ...,
        alias="touch_tip",
        description="Touch tip settings for retract after dispense.",
    )
    delay: DelayProperties = Field(
        ..., description="Delay settings for retract after dispense."
    )


class AspirateProperties(BaseLiquidClassModel):
    """Properties specific to the aspirate function."""

    submerge: Submerge = Field(..., description="Submerge settings for aspirate.")
    retract: RetractAspirate = Field(
        ..., description="Pipette retract settings after an aspirate."
    )
    aspiratePosition: TipPosition = Field(
        ..., alias="aspirate_position", description="Tip position during aspirate."
    )
    flowRateByVolume: LiquidHandlingPropertyByVolume = Field(
        ...,
        alias="flow_rate_by_volume",
        description="Settings for flow rate keyed by target aspiration volume.",
    )
    correctionByVolume: CorrectionByVolume = Field(
        ...,
        alias="correction_by_volume",
        description="Settings for volume correction keyed by by target aspiration volume,"
        " representing additional volume the plunger should move to accurately hit target volume.",
    )
    preWet: bool = Field(
        ..., alias="pre_wet", description="Whether to perform a pre-wet action."
    )
    mix: MixProperties = Field(
        ..., description="Mixing settings for before an aspirate"
    )
    delay: DelayProperties = Field(..., description="Delay settings after an aspirate")


class SingleDispenseProperties(BaseLiquidClassModel):
    """Properties specific to the single-dispense function."""

    submerge: Submerge = Field(
        ..., description="Submerge settings for single dispense."
    )
    retract: RetractDispense = Field(
        ..., description="Pipette retract settings after a single dispense."
    )
    dispensePosition: TipPosition = Field(
        ..., alias="dispense_position", description="Tip position during dispense."
    )
    flowRateByVolume: LiquidHandlingPropertyByVolume = Field(
        ...,
        alias="flow_rate_by_volume",
        description="Settings for flow rate keyed by target dispense volume.",
    )
    correctionByVolume: CorrectionByVolume = Field(
        ...,
        alias="correction_by_volume",
        description="Settings for volume correction keyed by by target dispense volume,"
        " representing additional volume the plunger should move to accurately hit target volume.",
    )
    mix: MixProperties = Field(..., description="Mixing settings for after a dispense")
    pushOutByVolume: LiquidHandlingPropertyByVolume = Field(
        ...,
        alias="push_out_by_volume",
        description="Settings for pushout keyed by target dispense volume.",
    )
    delay: DelayProperties = Field(..., description="Delay after dispense, in seconds.")


class MultiDispenseProperties(BaseLiquidClassModel):
    """Properties specific to the multi-dispense function."""

    submerge: Submerge = Field(..., description="Submerge settings for multi-dispense.")
    retract: RetractDispense = Field(
        ..., description="Pipette retract settings after a multi-dispense."
    )
    dispensePosition: TipPosition = Field(
        ..., alias="dispense_position", description="Tip position during dispense."
    )
    flowRateByVolume: LiquidHandlingPropertyByVolume = Field(
        ...,
        alias="flow_rate_by_volume",
        description="Settings for flow rate keyed by target dispense volume.",
    )
    correctionByVolume: CorrectionByVolume = Field(
        ...,
        alias="correction_by_volume",
        description="Settings for volume correction keyed by by target dispense volume,"
        " representing additional volume the plunger should move to accurately hit target volume.",
    )
    conditioningByVolume: LiquidHandlingPropertyByVolume = Field(
        ...,
        alias="conditioning_by_volume",
        description="Settings for conditioning volume keyed by target dispense volume.",
    )
    disposalByVolume: LiquidHandlingPropertyByVolume = Field(
        ...,
        alias="disposal_by_volume",
        description="Settings for disposal volume keyed by target dispense volume.",
    )
    delay: DelayProperties = Field(
        ..., description="Delay settings after each dispense"
    )


class TransferProperties(BaseLiquidClassModel):
    """Properties used during a transfer."""

    aspirate: AspirateProperties = Field(
        ..., description="Aspirate parameters for this tip type."
    )
    singleDispense: SingleDispenseProperties = Field(
        ...,
        alias="dispense",
        description="Single dispense parameters for this tip type.",
    )
    multiDispense: MultiDispenseProperties | SkipJsonSchema[None] = Field(
        None,
        alias="multi_dispense",
        description="Optional multi-dispense parameters for this tip type.",
        json_schema_extra=_remove_default,
    )


class ByTipTypeSetting(TransferProperties):
    """Settings for each kind of tip this pipette can use."""

    tiprack: str = Field(
        ...,
        description="The name of tiprack whose tip will be used when handling this specific liquid class with this pipette",
    )


class ByPipetteSetting(BaseLiquidClassModel):
    """The settings for this liquid class when used with a specific kind of pipette."""

    pipetteModel: str = Field(..., description="The pipette model this applies to.")
    byTipType: Sequence[ByTipTypeSetting] = Field(
        ..., description="Settings for each kind of tip this pipette can use"
    )


class LiquidClassSchemaV1(BaseLiquidClassModel):
    """Defines a single liquid class's properties for liquid handling functions."""

    liquidClassName: str = Field(
        ..., description="The name of the liquid (e.g., water, ethanol, serum)."
    )
    displayName: str = Field(..., description="User-readable name of the liquid class.")
    description: str = Field(
        ..., description="User-readable description of the liquid class"
    )
    schemaVersion: Literal[1] = Field(
        ..., description="Which schema version a liquid class is using"
    )
    version: int = Field(
        ..., description="Version of the specific liquid class definition"
    )
    namespace: str = Field(...)
    byPipette: Sequence[ByPipetteSetting] = Field(
        ...,
        description="Liquid class settings by each pipette compatible with this liquid class.",
    )
