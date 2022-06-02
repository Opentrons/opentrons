"""Utilities for calculating motion correctly."""

from typing import Callable, Dict, Union, overload, Type
from collections import OrderedDict
from opentrons.types import Mount, Point
from opentrons.calibration_storage.types import AttitudeMatrix
from opentrons.util import linal
from .types import Axis, OT3Axis, OT3Mount
from functools import lru_cache


@lru_cache(4)
def offset_for_mount(
    primary_mount: Union[Mount, OT3Mount],
    left_mount_offset: Point,
    right_mount_offset: Point,
) -> Point:
    offsets = {
        Mount.LEFT: left_mount_offset,
        Mount.RIGHT: right_mount_offset,
        OT3Mount.LEFT: left_mount_offset,
        OT3Mount.RIGHT: right_mount_offset,
    }
    return offsets[primary_mount]


@overload
def _x_for_mount(mount: Mount) -> Axis:
    ...


@overload
def _x_for_mount(mount: OT3Mount) -> OT3Axis:
    ...


def _x_for_mount(mount: Union[Mount, OT3Mount]) -> Union[Axis, OT3Axis]:
    if isinstance(mount, Mount):
        return Axis.X
    else:
        return OT3Axis.X


@overload
def _y_for_mount(mount: Mount) -> Axis:
    ...


@overload
def _y_for_mount(mount: OT3Mount) -> OT3Axis:
    ...


def _y_for_mount(mount: Union[Mount, OT3Mount]) -> Union[Axis, OT3Axis]:
    if isinstance(mount, Mount):
        return Axis.Y
    else:
        return OT3Axis.Y


@overload
def _z_for_mount(mount: Mount) -> Axis:
    ...


@overload
def _z_for_mount(mount: OT3Mount) -> OT3Axis:
    ...


def _z_for_mount(mount: Union[Mount, OT3Mount]) -> Union[Axis, OT3Axis]:
    if isinstance(mount, Mount):
        return Axis.by_mount(mount)
    else:
        return OT3Axis.by_mount(mount)


@overload
def _plunger_for_mount(mount: Mount) -> Axis:
    ...


@overload
def _plunger_for_mount(mount: OT3Mount) -> OT3Axis:
    ...


def _plunger_for_mount(mount: Union[Mount, OT3Mount]) -> Union[Axis, OT3Axis]:
    if isinstance(mount, Mount):
        return Axis.of_plunger(mount)
    else:
        return OT3Axis.of_main_tool_actuator(mount)


@overload
def _axis_name(ax: Axis) -> str:
    ...


@overload
def _axis_name(ax: OT3Axis) -> OT3Axis:
    ...


def _axis_name(ax: Union[Axis, OT3Axis]) -> Union[str, OT3Axis]:
    if isinstance(ax, Axis):
        return ax.name
    else:
        return ax


@overload
def _axis_enum(ax: str) -> Axis:
    ...


@overload
def _axis_enum(ax: OT3Axis) -> OT3Axis:
    ...


def _axis_enum(ax: Union[str, OT3Axis]) -> Union[Axis, OT3Axis]:
    if isinstance(ax, OT3Axis):
        return ax
    else:
        return Axis[ax]


@overload
def target_position_from_absolute(
    mount: Mount,
    abs_position: Point,
    get_critical_point: Callable[[Mount], Point],
    left_mount_offset: Point,
    right_mount_offset: Point,
) -> "OrderedDict[Axis, float]":
    ...


@overload
def target_position_from_absolute(
    mount: OT3Mount,
    abs_position: Point,
    get_critical_point: Callable[[OT3Mount], Point],
    left_mount_offset: Point,
    right_mount_offset: Point,
) -> "OrderedDict[OT3Axis, float]":
    ...


# a note on the type ignoring of this and other overload implementation
# functions: These functions are overloads in the first place because
# that's the only way to create a semantic link between syntactically
# unrelated types - the types of different arguments and return types
# that can't really be related to each other in the type system. for
# instance,
# def do_something(a: Union[str, int], b: Union[str, int])
# implies that all of the four cases of (a: int, b: str), (a: str, b: str),
# (a: int, b: int, a: str, b: int) are semantically valid. typing
# @overload
# def do_something(a: int, b: int)
# @overload
# def do_something(a: str, b: str)
# narrows that to 2.
#
# It's needed here because OT3Mount and OT3Axis can't really be
# related, neither can Mount and Axis and str, etc.
# The problem is that this is for _external callers_. When typechecking
# the implementation of the overload, mypy doesn't consider the overload
# type signatures (see e.g. https://github.com/python/mypy/issues/9503).
# And as discussed above, there's no way to write the type signature without
# them. So, ignored.
def target_position_from_absolute(  # type: ignore[no-untyped-def]
    mount,
    abs_position,
    get_critical_point,
    left_mount_offset,
    right_mount_offset,
):
    offset = offset_for_mount(mount, left_mount_offset, right_mount_offset)
    primary_cp = get_critical_point(mount)
    primary_z = _z_for_mount(mount)
    target_position = OrderedDict(
        (
            (_x_for_mount(mount), abs_position.x - offset.x - primary_cp.x),
            (_y_for_mount(mount), abs_position.y - offset.y - primary_cp.y),
            (primary_z, abs_position.z - offset.z - primary_cp.z),
        )
    )
    return target_position


@overload
def target_position_from_relative(
    mount: Mount, delta: Point, current_position: Dict[Axis, float]
) -> "OrderedDict[Axis, float]":
    ...


@overload
def target_position_from_relative(
    mount: OT3Mount, delta: Point, current_position: Dict[OT3Axis, float]
) -> "OrderedDict[OT3Axis, float]":
    ...


def target_position_from_relative(  # type: ignore[no-untyped-def]
    mount,
    delta,
    current_position,
):
    """Create a target position for all specified machine axes."""
    primary_z = _z_for_mount(mount)
    x_ax = _x_for_mount(mount)
    y_ax = _y_for_mount(mount)
    target_position = OrderedDict(
        (
            (x_ax, current_position[x_ax] + delta[0]),
            (y_ax, current_position[y_ax] + delta[1]),
            (primary_z, current_position[primary_z] + delta[2]),
        )
    )
    return target_position


@overload
def target_position_from_plunger(
    mount: Mount, delta: float, current_position: Dict[Axis, float]
) -> "OrderedDict[Axis, float]":
    ...


@overload
def target_position_from_plunger(
    mount: OT3Mount, delta: float, current_position: Dict[OT3Axis, float]
) -> "OrderedDict[OT3Axis, float]":
    ...


def target_position_from_plunger(  # type: ignore[no-untyped-def]
    mount,
    delta,
    current_position,
):
    """Create a target position for machine axes including plungers.

    Axis positions other than the plunger are identical to current
    position.
    """
    x_ax = _x_for_mount(mount)
    y_ax = _y_for_mount(mount)
    all_axes_pos = OrderedDict(
        (
            (x_ax, current_position[x_ax]),
            (y_ax, current_position[y_ax]),
        )
    )
    plunger_pos = OrderedDict()
    z_ax = _z_for_mount(mount)
    plunger = _plunger_for_mount(mount)
    all_axes_pos[z_ax] = current_position[z_ax]
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


@overload
def machine_from_deck(
    deck_pos: Dict[Axis, float], attitude: AttitudeMatrix, offset: Point
) -> Dict[str, float]:
    ...


@overload
def machine_from_deck(
    deck_pos: Dict[OT3Axis, float], attitude: AttitudeMatrix, offset: Point
) -> Dict[OT3Axis, float]:
    ...


def machine_from_deck(  # type: ignore[no-untyped-def]
    deck_pos,
    attitude,
    offset,
):
    """Build a machine-axis position from a deck position"""
    to_transform = Point(*(tp for ax, tp in deck_pos.items() if ax in ax.gantry_axes()))

    # Pre-fill the dict we’ll send to the backend with the axes we don’t
    # need to transform
    machine_pos = {
        _axis_name(ax): pos
        for ax, pos in deck_pos.items()
        if ax not in ax.gantry_axes()
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
        _axis_name(ax): transformed[idx]
        for idx, ax in enumerate(deck_pos.keys())
        if ax in ax.gantry_axes()
    }
    machine_pos.update({ax: pos for ax, pos in to_check.items()})
    return machine_pos


@overload
def deck_from_machine(
    machine_pos: Dict[str, float],
    attitude: AttitudeMatrix,
    offset: Point,
    axis_enum: Type[Axis],
) -> Dict[Axis, float]:
    ...


@overload
def deck_from_machine(
    machine_pos: Dict[OT3Axis, float],
    attitude: AttitudeMatrix,
    offset: Point,
    axis_enum: Type[OT3Axis],
) -> Dict[OT3Axis, float]:
    ...


def deck_from_machine(  # type: ignore[no-untyped-def]
    machine_pos,
    attitude,
    offset,
    axis_enum,
):
    """Build a deck-abs position store from the machine's position"""
    with_enum = {_axis_enum(k): v for k, v in machine_pos.items()}
    plunger_axes = {k: v for k, v in with_enum.items() if k not in k.gantry_axes()}
    right = Point(
        with_enum[axis_enum.X],
        with_enum[axis_enum.Y],
        with_enum[axis_enum.by_mount(Mount.RIGHT)],
    )
    left = Point(
        with_enum[axis_enum.X],
        with_enum[axis_enum.Y],
        with_enum[axis_enum.by_mount(Mount.LEFT)],
    )

    right_deck = deck_point_from_machine_point(right, attitude, offset)
    left_deck = deck_point_from_machine_point(left, attitude, offset)
    deck_pos = {
        axis_enum.X: right_deck[0],
        axis_enum.Y: right_deck[1],
        axis_enum.by_mount(Mount.RIGHT): right_deck[2],
        axis_enum.by_mount(Mount.LEFT): left_deck[2],
    }
    deck_pos.update(plunger_axes)
    return deck_pos


def machine_vector_from_deck_vector(
    machine_vector: Point, attitude: AttitudeMatrix
) -> Point:
    """Take a vector and pass it through the attitude matrix."""
    return machine_point_from_deck_point(machine_vector, attitude, Point(0, 0, 0))
