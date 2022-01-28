"""Utilities for calculating motion correctly."""

from typing import Callable, Dict, Optional, Tuple, Union, Iterator, Sequence
from collections import OrderedDict
from opentrons.types import Mount, Point
from .types import PipettePair, Axis
from functools import lru_cache


def mounts(z_axis: Union[PipettePair, Mount]) -> Tuple[Mount, Optional[Mount]]:
    if isinstance(z_axis, PipettePair):
        return (z_axis.primary, z_axis.secondary)
    else:
        return (z_axis, None)


def mounts_enumerable(z_axis: Union[PipettePair, Mount]) -> Iterator[Mount]:
    mount_or_pair = mounts(z_axis)
    for mount in mount_or_pair:
        if mount:
            yield mount


@lru_cache(2)
def offset_for_mount(
    primary_mount: Mount, left_mount_offset: Point, right_mount_offset: Point
) -> Tuple[Point, Point]:
    offsets = {Mount.LEFT: left_mount_offset, Mount.RIGHT: right_mount_offset}
    return (
        offsets[primary_mount],
        offsets[{Mount.RIGHT: Mount.LEFT, Mount.LEFT: Mount.RIGHT}[primary_mount]],
    )


def target_position_from_absolute(
    mount: Union[Mount, PipettePair],
    abs_position: Point,
    get_critical_point: Callable[[Mount], Point],
    left_mount_offset: Point,
    right_mount_offset: Point,
) -> "Tuple[OrderedDict[Axis, float], Mount, Optional[Axis]]":
    primary_mount, secondary_mount = mounts(mount)

    primary_offset, secondary_offset = offset_for_mount(
        primary_mount, left_mount_offset, right_mount_offset
    )
    primary_cp = get_critical_point(primary_mount)
    primary_z = Axis.by_mount(primary_mount)
    target_position = OrderedDict(
        (
            (Axis.X, abs_position.x - primary_offset.x - primary_cp.x),
            (Axis.Y, abs_position.y - primary_offset.y - primary_cp.y),
            (primary_z, abs_position.z - primary_offset.z - primary_cp.z),
        )
    )

    if secondary_mount:
        other_z = Axis.by_mount(secondary_mount)
        secondary_cp = get_critical_point(secondary_mount)
        target_position[other_z] = abs_position.z - secondary_offset.z - secondary_cp.z
        secondary_z: Optional[Axis] = other_z
    else:
        secondary_z = None
    return target_position, primary_mount, secondary_z


def target_position_from_relative(
    mount: Union[Mount, PipettePair],
    delta: Union[Point, Sequence[float]],
    current_position: Dict[Axis, float],
) -> "Tuple[OrderedDict[Axis, float], Mount, Optional[Axis]]":
    """Create a target position for all specified machine axes.

    If mount is a pair, then delta can be either a Point or a length
    3 or 4 sequence. If a 4-sequence, the last two elements are mapped
    to (primary, secondary) in the pair. If a 3-sequence or Point,
    the last element is used for both z positions.
    """
    assert len(delta) < 5
    primary_mount, secondary_mount = mounts(mount)

    primary_z = Axis.by_mount(primary_mount)
    target_position = OrderedDict(
        (
            (Axis.X, current_position[Axis.X] + delta[0]),
            (Axis.Y, current_position[Axis.Y] + delta[1]),
            (primary_z, current_position[primary_z] + delta[2]),
        )
    )

    if secondary_mount:
        other_z = Axis.by_mount(secondary_mount)
        secondary_z: Optional[Axis] = other_z
        target_position[other_z] = current_position[other_z] + delta[-1]
    else:
        secondary_z = None

    return target_position, primary_mount, secondary_z


def target_position_from_plunger(
    mount: Union[Mount, PipettePair],
    delta: Sequence[float],
    current_position: Dict[Axis, float],
) -> "Tuple[OrderedDict[Axis, float], Mount, Optional[Axis]]":
    """Create a target position for machine axes including plungers.

    If mount is a pair, then delta can be a 1- or 2-sequence. If mount
    If a 2-sequence, then the two plungers go to different positions.
    If a 1-sequence, both plungers go to the same position.

    Axis positions other than the plunger are identical to current
    position.
    """
    assert len(delta) < 3
    all_axes_pos = OrderedDict(
        (
            (Axis.X, current_position[Axis.X]),
            (Axis.Y, current_position[Axis.Y]),
        )
    )
    plunger_pos = OrderedDict()
    secondary_z = None
    for idx, m in enumerate(mounts_enumerable(mount)):
        z = Axis.by_mount(m)
        plunger = Axis.of_plunger(m)
        all_axes_pos[z] = current_position[z]
        plunger_pos[plunger] = delta[idx]
        if idx == 1:
            secondary_z = z
    all_axes_pos.update(plunger_pos)
    return all_axes_pos, mounts(mount)[0], secondary_z
