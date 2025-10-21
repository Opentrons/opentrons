"""Type definitions for liquid classes."""
from typing import Sequence, Tuple, TypedDict
from typing_extensions import NotRequired
from .liquid_class_definition import (
    POSITION_REFERENCE_VALUE_TYPE,
    BLOWOUT_LOCATION_VALUE_TYPE,
)


class Offset(TypedDict):
    """A dict representing an offset."""

    x: float
    y: float
    z: float


class TipPositionDict(TypedDict):
    """A dict representing a tip position."""

    position_reference: POSITION_REFERENCE_VALUE_TYPE
    offset: Offset


class DelayPropertiesDict(TypedDict):
    """A dict representing a delay."""

    enabled: bool
    duration: NotRequired[float]


class TouchTipPropertiesDict(TypedDict):
    """A dict representing touch tip properties."""

    enabled: bool
    z_offset: NotRequired[float]
    mm_from_edge: NotRequired[float]
    speed: NotRequired[float]


class MixPropertiesDict(TypedDict):
    """A dict representing mix properties."""

    enabled: bool
    repetitions: NotRequired[int]
    volume: NotRequired[float]


class BlowoutPropertiesDict(TypedDict):
    """A dict representing blowout properties."""

    enabled: bool
    location: NotRequired[BLOWOUT_LOCATION_VALUE_TYPE]
    flow_rate: NotRequired[float]


class SubmergeDict(TypedDict):
    """A dict representing submerge properties."""

    start_position: TipPositionDict
    speed: float
    delay: DelayPropertiesDict


class RetractAspirateDict(TypedDict):
    """A dict representing retract aspirate properties."""

    end_position: TipPositionDict
    speed: float
    delay: DelayPropertiesDict
    air_gap_by_volume: Sequence[Tuple[float, float]]
    touch_tip: TouchTipPropertiesDict


class RetractDispenseDict(TypedDict):
    """A dict representing retract dispense properties."""

    end_position: TipPositionDict
    speed: float
    delay: DelayPropertiesDict
    air_gap_by_volume: Sequence[Tuple[float, float]]
    touch_tip: TouchTipPropertiesDict
    blowout: BlowoutPropertiesDict


class AspiratePropertiesDict(TypedDict):
    """A dict representing aspirate properties."""

    submerge: SubmergeDict
    flow_rate_by_volume: Sequence[Tuple[float, float]]
    correction_by_volume: Sequence[Tuple[float, float]]
    delay: DelayPropertiesDict
    aspirate_position: TipPositionDict
    retract: RetractAspirateDict
    pre_wet: bool
    mix: MixPropertiesDict


class SingleDispensePropertiesDict(TypedDict):
    """A dict representing single dispense properties."""

    submerge: SubmergeDict
    flow_rate_by_volume: Sequence[Tuple[float, float]]
    correction_by_volume: Sequence[Tuple[float, float]]
    delay: DelayPropertiesDict
    dispense_position: TipPositionDict
    retract: RetractDispenseDict
    push_out_by_volume: Sequence[Tuple[float, float]]
    mix: MixPropertiesDict


class MultiDispensePropertiesDict(TypedDict):
    """A dict representing multi dispense properties."""

    submerge: SubmergeDict
    flow_rate_by_volume: Sequence[Tuple[float, float]]
    correction_by_volume: Sequence[Tuple[float, float]]
    delay: DelayPropertiesDict
    dispense_position: TipPositionDict
    retract: RetractDispenseDict
    conditioning_by_volume: Sequence[Tuple[float, float]]
    disposal_by_volume: Sequence[Tuple[float, float]]


class TransferPropertiesDict(TypedDict):
    """A dict representing transfer properties for a specific pipette and tiprack."""

    aspirate: AspiratePropertiesDict
    dispense: SingleDispensePropertiesDict
    multi_dispense: NotRequired[MultiDispensePropertiesDict]
