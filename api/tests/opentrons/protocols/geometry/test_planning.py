"""Tests for motion planning module."""
import pytest
from opentrons.types import Point
from opentrons.hardware_control.types import CriticalPoint as CP
from opentrons.protocols.geometry.planning import (
    LabwareHeightError,
    MoveType,
    get_move_type,
    get_waypoints
)


def test_get_move_type_general(min_lw, min_lw2):
    """It should identify general moves."""
    from_loc = min_lw.wells()[0].top()
    to_loc = min_lw2.wells()[0].top()

    result = get_move_type(from_loc, to_loc)
    assert result == MoveType.GENERAL_ARC


def test_get_move_type_in_labware(min_lw):
    """It should identify general moves."""
    from_loc = min_lw.wells()[0].top()
    to_loc = min_lw.wells()[1].top()

    result = get_move_type(from_loc, to_loc)
    assert result == MoveType.IN_LABWARE_ARC


def test_get_move_type_in_well(min_lw):
    """It should identify general moves."""
    from_loc = min_lw.wells()[0].top()
    to_loc = min_lw.wells()[0].bottom()

    result = get_move_type(from_loc, to_loc)
    assert result == MoveType.DIRECT


def test_get_move_type_general_with_force_direct(min_lw, min_lw2):
    """It should identify general moves."""
    from_loc = min_lw.wells()[0].top()
    to_loc = min_lw2.wells()[0].top()

    result = get_move_type(from_loc, to_loc, force_direct=True)
    assert result == MoveType.DIRECT


def test_get_waypoints_direct():
    """It should move directly to points."""
    result = get_waypoints(
        origin=Point(1, 2, 3),
        dest=Point(1, 2, 4),
        move_type=MoveType.DIRECT,
        max_travel_z=100,
    )

    assert result == [
        (Point(1, 2, 4), None)
    ]


def test_get_waypoints_in_labware_arc():
    """It should use min_travel_z with well_z_margin to path in-labware arc."""
    result = get_waypoints(
        origin=Point(1, 1, 3),
        dest=Point(2, 2, 3),
        move_type=MoveType.IN_LABWARE_ARC,
        min_travel_z=5,
        max_travel_z=100,
    )

    assert result == [
        (Point(1, 1, 10), None),
        (Point(2, 2, 10), None),
        (Point(2, 2, 3), None),
    ]


def test_get_waypoints_in_labware_arc_with_high_origin():
    """It should favor dest height over travel z if point is higher."""
    result = get_waypoints(
        origin=Point(1, 1, 10),
        dest=Point(2, 2, 11),
        move_type=MoveType.IN_LABWARE_ARC,
        # min_travel_z lower than to and from points
        min_travel_z=3,
        max_travel_z=100,
    )

    assert result == [
        (Point(1, 1, 11), None),
        (Point(2, 2, 11), None),
    ]


def test_get_waypoints_in_labware_arc_with_high_dest():
    """It should favor origin height over travel z if point is higher."""
    result = get_waypoints(
        origin=Point(1, 1, 11),
        dest=Point(2, 2, 10),
        move_type=MoveType.IN_LABWARE_ARC,
        # min_travel_z lower than to and from points
        min_travel_z=3,
        max_travel_z=100,
    )

    assert result == [
        (Point(2, 2, 11), None),
        (Point(2, 2, 10), None),
    ]


def test_get_waypoints_general_arc():
    """It should use the safe_z with lw_z_margin to path a general arc."""
    result = get_waypoints(
        origin=Point(1, 1, 3),
        dest=Point(2, 2, 3),
        move_type=MoveType.GENERAL_ARC,
        min_travel_z=5,
        max_travel_z=100,
    )

    assert result == [
        (Point(1, 1, 15), None),
        (Point(2, 2, 15), None),
        (Point(2, 2, 3), None),
    ]


def test_get_waypoints_general_arc_with_high_origin():
    """It should favor dest height over travel z if point is higher."""
    result = get_waypoints(
        origin=Point(1, 1, 14),
        dest=Point(2, 2, 15),
        move_type=MoveType.IN_LABWARE_ARC,
        # min_travel_z lower than to and from points
        min_travel_z=3,
        max_travel_z=100,
    )

    assert result == [
        (Point(1, 1, 15), None),
        (Point(2, 2, 15), None),
    ]


def test_get_waypoints_general_arc_with_high_dest():
    """It should favor origin height over travel z if point is higher."""
    result = get_waypoints(
        origin=Point(1, 1, 15),
        dest=Point(2, 2, 14),
        move_type=MoveType.GENERAL_ARC,
        # min_travel_z lower than to and from points
        min_travel_z=3,
        max_travel_z=100,
    )

    assert result == [
        (Point(2, 2, 15), None),
        (Point(2, 2, 14), None),
    ]


def test_get_waypoints_with_extra_waypoints():
    """It should allow extra XY waypoints."""
    result = get_waypoints(
        origin=Point(1, 1, 3),
        dest=Point(2, 2, 3),
        move_type=MoveType.GENERAL_ARC,
        min_travel_z=5,
        xy_waypoints=[(1, 1.5), (1.5, 1)],
        max_travel_z=100,
    )

    assert result == [
        (Point(1, 1, 15), None),
        (Point(1, 1.5, 15), None),
        (Point(1.5, 1, 15), None),
        (Point(2, 2, 15), None),
        (Point(2, 2, 3), None),
    ]


def test_get_waypoints_with_critical_points():
    """It should attach critical points to origin and destination points."""
    result = get_waypoints(
        origin=Point(1, 1, 3),
        dest=Point(2, 2, 3),
        origin_cp=CP.XY_CENTER,
        dest_cp=CP.FRONT_NOZZLE,
        move_type=MoveType.GENERAL_ARC,
        min_travel_z=5,
        max_travel_z=100,
        xy_waypoints=[(1, 1.5), (1.5, 1)],

    )

    assert result == [
        (Point(1, 1, 15), CP.XY_CENTER),
        (Point(1, 1.5, 15), CP.FRONT_NOZZLE),
        (Point(1.5, 1, 15), CP.FRONT_NOZZLE),
        (Point(2, 2, 15), CP.FRONT_NOZZLE),
        (Point(2, 2, 3), CP.FRONT_NOZZLE),
    ]


def test_get_waypoints_clamps_to_max_travel_z():
    """It should clamp the travel Z to max_travel_z if it has the clearance."""
    result = get_waypoints(
        origin=Point(1, 1, 3),
        dest=Point(2, 2, 3),
        move_type=MoveType.GENERAL_ARC,
        min_travel_z=5,
        max_travel_z=6,
    )

    assert result == [
        (Point(1, 1, 6), None),
        (Point(2, 2, 6), None),
        (Point(2, 2, 3), None),
    ]


def test_get_waypoints_raises_if_no_max_travel_z_clearance():
    """It raises LabwareHeightError if max_travel_z doesn't have clearance."""
    with pytest.raises(LabwareHeightError):
        get_waypoints(
            origin=Point(1, 1, 3),
            dest=Point(2, 2, 3),
            move_type=MoveType.GENERAL_ARC,
            min_travel_z=5,
            max_travel_z=5.9,
        )


def test_get_waypoints_raises_if_dest_has_no_clearance():
    """It raises LabwareHeightError if dest z doesn't have clearance."""
    with pytest.raises(LabwareHeightError):
        get_waypoints(
            origin=Point(1, 1, 3),
            dest=Point(2, 2, 5),
            move_type=MoveType.GENERAL_ARC,
            min_travel_z=5,
            max_travel_z=5.9,
        )


def test_get_waypoints_direct_moves_ignore_clearance_requirements():
    """It ignores clearance requirements for direct moves."""
    result = get_waypoints(
        origin=Point(1, 1, 3),
        dest=Point(1, 1, 5.5),
        move_type=MoveType.DIRECT,
        min_travel_z=5,
        max_travel_z=5.9,
    )

    assert result == [
        (Point(1, 1, 5.5), None)
    ]
