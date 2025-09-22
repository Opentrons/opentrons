"""Common functions between v1 transfer and liquid-class-based transfer."""
import enum
import math
from typing import Iterable, Generator, Tuple, TypeVar, Literal, List, Union

from opentrons.protocol_api._liquid_properties import (
    LiquidHandlingPropertyByVolume,
    TransferProperties,
)


class NoLiquidClassPropertyError(ValueError):
    """An error raised when a liquid class property cannot be found for a pipette/tip combination"""


class TransferTipPolicyV2(enum.Enum):
    ONCE = "once"
    NEVER = "never"
    ALWAYS = "always"
    PER_SOURCE = "per source"
    PER_DESTINATION = "per destination"


TransferTipPolicyV2Type = Literal[
    "once", "always", "per source", "never", "per destination"
]

Target = TypeVar("Target")


def check_valid_volume_parameters(
    disposal_volume: float, air_gap: float, max_volume: float
) -> None:
    if air_gap >= max_volume:
        raise ValueError(
            "The air gap must be less than the maximum volume of the pipette"
        )
    elif disposal_volume >= max_volume:
        raise ValueError(
            "The disposal volume must be less than the maximum volume of the pipette"
        )
    elif disposal_volume + air_gap >= max_volume:
        raise ValueError(
            "The sum of the air gap and disposal volume must be less than"
            " the maximum volume of the pipette"
        )


def check_valid_liquid_class_volume_parameters(
    aspirate_volume: float,
    air_gap: float,
    max_volume: float,
    current_volume: float,
) -> None:
    if (
        current_volume != 0.0
        and air_gap + aspirate_volume + current_volume > max_volume
    ):
        raise ValueError(
            f"Cannot have an air gap of {air_gap} µL for an aspiration of {aspirate_volume} µL with"
            f" a max volume of {max_volume} µL when {current_volume} µL has already been aspirated."
            f" Please adjust the retract air gap to fit within the bounds of the tip."
        )
    elif air_gap + aspirate_volume > max_volume:
        raise ValueError(
            f"Cannot have an air gap of {air_gap} µL for an aspiration of {aspirate_volume} µL"
            f" with a max volume of {max_volume} µL. Please adjust the retract air gap to fit within"
            f" the bounds of the tip."
        )


def expand_for_volume_constraints(
    volumes: Iterable[float],
    targets: Iterable[Target],
    max_volume: float,
) -> Generator[Tuple[float, "Target"], None, None]:
    """Split a sequence of proposed transfers if necessary to keep each
    transfer under the given max volume.
    """
    # A final defense against an infinite loop.
    # Raising a proper exception with a helpful message is left to calling code,
    # because it has more context about what the user is trying to do.
    assert max_volume > 0
    for volume, target in zip(volumes, targets):
        while volume > max_volume * 2:
            yield max_volume, target
            volume -= max_volume

        if volume > max_volume:
            volume /= 2
            yield volume, target
        yield volume, target


def _split_volume_equally(volume: float, max_volume: float) -> List[float]:
    """
    Splits a given volume into a list of volumes that are all less than or equal to max volume.

    If volume provided is more than the max volume, the volumes will be split evenly.
    """
    if volume <= max_volume:
        return [volume]
    else:
        iterations = math.ceil(volume / max_volume)
        return [volume / iterations for _ in range(iterations)]


def get_sources_and_destinations_for_liquid_classes(
    volumes: List[float],
    max_volume: float,
    targets: Iterable[Target],
    transfer_properties: TransferProperties,
    is_multi_dispense: bool = False,
) -> Generator[Tuple[float, "Target"], None, None]:
    """Return a list of targets (wells or tuples of wells) and volumes for a liquid class transfer."""
    aspirate_air_gap_by_volume = transfer_properties.aspirate.retract.air_gap_by_volume
    if is_multi_dispense:
        assert transfer_properties.multi_dispense is not None
        disposal_vol_by_volume = transfer_properties.multi_dispense.disposal_by_volume
        conditioning_vol_by_volume = (
            transfer_properties.multi_dispense.conditioning_by_volume
        )
        return expand_for_volume_constraints_for_liquid_classes(
            volumes=volumes,
            targets=targets,
            max_volume=max_volume,
            air_gap=aspirate_air_gap_by_volume,
            disposal_vol=disposal_vol_by_volume,
            conditioning_vol=conditioning_vol_by_volume,
        )
    return expand_for_volume_constraints_for_liquid_classes(
        volumes=volumes,
        targets=targets,
        max_volume=max_volume,
        air_gap=aspirate_air_gap_by_volume,
    )


def expand_for_volume_constraints_for_liquid_classes(
    volumes: Iterable[float],
    targets: Iterable[Target],
    max_volume: float,
    air_gap: Union[LiquidHandlingPropertyByVolume, float],
    disposal_vol: Union[LiquidHandlingPropertyByVolume, float] = 0.0,
    conditioning_vol: Union[LiquidHandlingPropertyByVolume, float] = 0.0,
) -> Generator[Tuple[float, "Target"], None, None]:
    """Split a sequence of proposed transfers to keep each under the max volume, splitting larger ones equally."""
    assert max_volume > 0
    for volume, target in zip(volumes, targets):
        disposal_volume = (
            disposal_vol
            if isinstance(disposal_vol, float)
            else disposal_vol.get_for_volume(volume)
        )
        air_gap_volume = (
            air_gap
            if isinstance(air_gap, float)
            else air_gap.get_for_volume(volume + disposal_volume)
        )
        conditioning_volume = (
            conditioning_vol
            if isinstance(conditioning_vol, float)
            else conditioning_vol.get_for_volume(volume)
        )
        # If there is conditioning volume in a multi-aspirate, it will negate the air gap
        if conditioning_volume > 0:
            air_gap_volume = 0
        adjusted_max_volume = (
            max_volume - air_gap_volume - disposal_volume - conditioning_volume
        )
        if adjusted_max_volume <= 0:
            error_text = f"Pipette cannot aspirate {volume} µL when pipette will need {air_gap_volume} µL for air gap"
            if disposal_volume:
                error_text += f", {disposal_volume} for disposal volume"
            if conditioning_volume:
                error_text += f", {conditioning_volume} for conditioning volume"
            error_text += f" with a max volume of {max_volume} µL."
            raise ValueError(error_text)
        for split_volume in _split_volume_equally(volume, adjusted_max_volume):
            yield split_volume, target
