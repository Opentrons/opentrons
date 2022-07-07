"""Utilities for calculating motion correctly."""

from typing import Callable, Dict, Union, overload, TypeVar, Optional, cast
from collections import OrderedDict
from opentrons.types import Mount, Point
from opentrons.calibration_storage.types import AttitudeMatrix
from opentrons.util import linal
from .types import Axis, OT3Axis, OT3Mount
from functools import lru_cache


# TODO: The offset_for_mount function should be defined with an overload
# set, as with other functions in this module. Unfortunately, mypy < 0.920
# has an internal crash when you mix overloads and particular kinds of decorators
# ( https://github.com/python/mypy/pull/11630 fixes it ) so instead it's defined
# with unions and therefore requires a bit of casting.
# @overload
# def offset_for_mount(
#     primary_mount: Mount,
#     left_mount_offset: Point,
#     right_mount_offset: Point,
#     gripper_mount_offset: None,
# ) -> Point:
#     ...


# @overload
# def offset_for_mount(
#     primary_mount: OT3Mount,
#     left_mount_offset: Point,
#     right_mount_offset: Point,
#     gripper_mount_offset: Point,
# ) -> Point:
#     ...


@lru_cache(4)
def offset_for_mount(
    primary_mount: Union[OT3Mount, Mount],
    left_mount_offset: Point,
    right_mount_offset: Point,
    gripper_mount_offset: Optional[Point] = None,
) -> Point:
    offsets = {
        Mount.LEFT: left_mount_offset,
        Mount.RIGHT: right_mount_offset,
        OT3Mount.LEFT: left_mount_offset,
        OT3Mount.RIGHT: right_mount_offset,
        OT3Mount.GRIPPER: cast(Point, gripper_mount_offset),
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
    gripper_mount_offset: None = None,
) -> "OrderedDict[Axis, float]":
    ...


@overload
def target_position_from_absolute(
    mount: OT3Mount,
    abs_position: Point,
    get_critical_point: Callable[[OT3Mount], Point],
    left_mount_offset: Point,
    right_mount_offset: Point,
    gripper_mount_offset: Point,
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
    gripper_mount_offset=None,
):
    offset = offset_for_mount(
        mount, left_mount_offset, right_mount_offset, gripper_mount_offset
    )
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


AxisType = TypeVar("AxisType", Axis, OT3Axis)


def machine_from_deck(
    deck_pos: Dict[AxisType, float],
    attitude: AttitudeMatrix,
    offset: Point,
) -> Dict[AxisType, float]:
    """Build a machine-axis position from a deck position"""
    to_transform = Point(*(tp for ax, tp in deck_pos.items() if ax in ax.gantry_axes()))

    # Pre-fill the dict we’ll send to the backend with the axes we don’t
    # need to transform
    machine_pos = {
        ax: pos for ax, pos in deck_pos.items() if ax not in ax.gantry_axes()
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
        ax: transformed[idx]
        for idx, ax in enumerate(deck_pos.keys())
        if ax in ax.gantry_axes()
    }
    machine_pos.update({ax: pos for ax, pos in to_check.items()})
    return machine_pos


def deck_from_machine(
    machine_pos: Dict[AxisType, float],
    attitude: AttitudeMatrix,
    offset: Point,
) -> Dict[AxisType, float]:
    """Build a deck-abs position store from the machine's position"""
    axis_enum = type(next(iter(machine_pos.keys())))
    plunger_axes = {k: v for k, v in machine_pos.items() if k not in k.gantry_axes()}
    mount_axes = {k: v for k, v in machine_pos.items() if k in k.mount_axes()}
    deck_positions_by_mount = {
        axis_enum.to_mount(axis): deck_point_from_machine_point(
            Point(machine_pos[axis_enum.X], machine_pos[axis_enum.Y], value),
            attitude,
            offset,
        )
        for axis, value in mount_axes.items()
    }
    position_for_gantry = next(iter(deck_positions_by_mount.values()))
    deck_pos = {
        axis_enum.X: position_for_gantry[0],
        axis_enum.Y: position_for_gantry[1],
    }
    for mount, pos in deck_positions_by_mount.items():
        deck_pos[axis_enum.by_mount(mount)] = pos[2]

    deck_pos.update(plunger_axes)
    return deck_pos


def machine_vector_from_deck_vector(
    machine_vector: Point, attitude: AttitudeMatrix
) -> Point:
    """Take a vector and pass it through the attitude matrix."""
    return machine_point_from_deck_point(machine_vector, attitude, Point(0, 0, 0))
