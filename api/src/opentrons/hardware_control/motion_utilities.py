"""Utilities for calculating motion correctly."""

from typing import Callable, Dict, Optional, Tuple, Union, Iterator, Sequence
from collections import OrderedDict
from opentrons.types import Mount, Point
from opentrons.calibration_storage.types import AttitudeMatrix
from opentrons.util import linal
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


def deck_point_from_machine_point(
    machine_point: Point, attitude: AttitudeMatrix, offset: Point
) -> Point:
    return Point(
        *linal.apply_reverse(
            attitude,
            machine_point - offset,
        )
    )


def machine_point_from_deck_point(
    deck_point: Point, attitude: AttitudeMatrix, offset: Point
) -> Point:
    return Point(*linal.apply_transform(attitude, deck_point)) + offset


def machine_from_deck(
    deck_pos: Dict[Axis, float],
    secondary_z: Optional[Axis],
    attitude: AttitudeMatrix,
    offset: Point,
) -> Dict[str, float]:
    """Build a machine-axis position from a deck position"""
    to_transform_primary = Point(
        *(
            tp
            for ax, tp in deck_pos.items()
            if (ax in Axis.gantry_axes() and ax != secondary_z)
        )
    )
    if secondary_z:
        to_transform_secondary = Point(0, 0, deck_pos[secondary_z])
    else:
        to_transform_secondary = Point(0, 0, 0)

    # Pre-fill the dict we’ll send to the backend with the axes we don’t
    # need to transform
    machine_pos = {
        ax.name: pos for ax, pos in deck_pos.items() if ax not in Axis.gantry_axes()
    }
    if len(to_transform_primary) != 3:
        raise ValueError(
            "Moves must specify either exactly an " "x, y, and (z or a) or none of them"
        )

    # Type ignored below because linal.apply_transform (rightly) specifies
    # Tuple[float, float, float] and the implied type from
    # target_position.items() is (rightly) Tuple[float, ...] with unbounded
    # size; unfortunately, mypy can’t quite figure out the length check
    # above that makes this OK
    primary_transformed = machine_point_from_deck_point(
        to_transform_primary, attitude, offset
    )
    if secondary_z:
        secondary_transformed = machine_point_from_deck_point(
            to_transform_secondary, attitude, offset
        )
    else:
        secondary_transformed = Point(0, 0, 0)

    transformed = (*primary_transformed, secondary_transformed[2])
    to_check = {
        ax.name: transformed[idx]
        for idx, ax in enumerate(deck_pos.keys())
        if ax in Axis.gantry_axes()
    }
    machine_pos.update({ax: pos for ax, pos in to_check.items()})
    return machine_pos


def deck_from_machine(
    machine_pos: Dict[str, float], attitude: AttitudeMatrix, offset: Point
) -> Dict[Axis, float]:
    """Build a deck-abs position store from the machine's position"""
    with_enum = {Axis[k]: v for k, v in machine_pos.items()}
    plunger_axes = {k: v for k, v in with_enum.items() if k not in Axis.gantry_axes()}
    right = Point(
        with_enum[Axis.X],
        with_enum[Axis.Y],
        with_enum[Axis.by_mount(Mount.RIGHT)],
    )
    left = Point(
        with_enum[Axis.X],
        with_enum[Axis.Y],
        with_enum[Axis.by_mount(Mount.LEFT)],
    )

    right_deck = deck_point_from_machine_point(right, attitude, offset)
    left_deck = deck_point_from_machine_point(left, attitude, offset)
    deck_pos = {
        Axis.X: right_deck[0],
        Axis.Y: right_deck[1],
        Axis.by_mount(Mount.RIGHT): right_deck[2],
        Axis.by_mount(Mount.LEFT): left_deck[2],
    }
    deck_pos.update(plunger_axes)
    return deck_pos
