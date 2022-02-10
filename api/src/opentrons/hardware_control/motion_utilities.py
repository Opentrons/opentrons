"""Utilities for calculating motion correctly."""

from typing import Callable, Dict
from collections import OrderedDict
from opentrons.types import Mount, Point
from opentrons.calibration_storage.types import AttitudeMatrix
from opentrons.util import linal
from .types import Axis
from functools import lru_cache


@lru_cache(2)
def offset_for_mount(
    primary_mount: Mount, left_mount_offset: Point, right_mount_offset: Point
) -> Point:
    offsets = {Mount.LEFT: left_mount_offset, Mount.RIGHT: right_mount_offset}
    return offsets[primary_mount]


def target_position_from_absolute(
    mount: Mount,
    abs_position: Point,
    get_critical_point: Callable[[Mount], Point],
    left_mount_offset: Point,
    right_mount_offset: Point,
) -> "OrderedDict[Axis, float]":
    offset = offset_for_mount(mount, left_mount_offset, right_mount_offset)
    primary_cp = get_critical_point(mount)
    primary_z = Axis.by_mount(mount)
    target_position = OrderedDict(
        (
            (Axis.X, abs_position.x - offset.x - primary_cp.x),
            (Axis.Y, abs_position.y - offset.y - primary_cp.y),
            (primary_z, abs_position.z - offset.z - primary_cp.z),
        )
    )
    return target_position


def target_position_from_relative(
    mount: Mount,
    delta: Point,
    current_position: Dict[Axis, float],
) -> "OrderedDict[Axis, float]":
    """Create a target position for all specified machine axes."""
    primary_z = Axis.by_mount(mount)
    target_position = OrderedDict(
        (
            (Axis.X, current_position[Axis.X] + delta[0]),
            (Axis.Y, current_position[Axis.Y] + delta[1]),
            (primary_z, current_position[primary_z] + delta[2]),
        )
    )
    return target_position


def target_position_from_plunger(
    mount: Mount,
    delta: float,
    current_position: Dict[Axis, float],
) -> "OrderedDict[Axis, float]":
    """Create a target position for machine axes including plungers.

    Axis positions other than the plunger are identical to current
    position.
    """
    all_axes_pos = OrderedDict(
        (
            (Axis.X, current_position[Axis.X]),
            (Axis.Y, current_position[Axis.Y]),
        )
    )
    plunger_pos = OrderedDict()
    z = Axis.by_mount(mount)
    plunger = Axis.of_plunger(mount)
    all_axes_pos[z] = current_position[z]
    plunger_pos[plunger] = delta
    all_axes_pos.update(plunger_pos)
    return all_axes_pos


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
    attitude: AttitudeMatrix,
    offset: Point,
) -> Dict[str, float]:
    """Build a machine-axis position from a deck position"""
    to_transform = Point(
        *(tp for ax, tp in deck_pos.items() if ax in Axis.gantry_axes())
    )

    # Pre-fill the dict we’ll send to the backend with the axes we don’t
    # need to transform
    machine_pos = {
        ax.name: pos for ax, pos in deck_pos.items() if ax not in Axis.gantry_axes()
    }
    if len(to_transform) != 3:
        raise ValueError(
            "Moves must specify either exactly an " "x, y, and (z or a) or none of them"
        )

    # Type ignored below because linal.apply_transform (rightly) specifies
    # Tuple[float, float, float] and the implied type from
    # target_position.items() is (rightly) Tuple[float, ...] with unbounded
    # size; unfortunately, mypy can’t quite figure out the length check
    # above that makes this OK
    transformed = machine_point_from_deck_point(to_transform, attitude, offset)

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
