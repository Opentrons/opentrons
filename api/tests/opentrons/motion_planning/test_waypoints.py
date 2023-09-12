"""Tests for motion planning module."""
import pytest

from opentrons.motion_planning.types import GripperMovementWaypointsWithJawStatus
from opentrons.protocol_engine.types import (
    LabwareMovementOffsetData,
    LabwareOffsetVector,
)
from opentrons.types import Point
from opentrons.hardware_control.types import CriticalPoint as CP

from opentrons.motion_planning import (
    get_waypoints,
    Waypoint,
    MoveType,
    DestinationOutOfBoundsError,
    ArcOutOfBoundsError,
    get_gripper_labware_movement_waypoints,
)


def test_get_waypoints_direct() -> None:
    """It should move directly to points."""
    result = get_waypoints(
        origin=Point(1, 2, 3),
        dest=Point(1, 2, 4),
        move_type=MoveType.DIRECT,
        min_travel_z=0,
        max_travel_z=100,
    )

    assert result == [Waypoint(Point(1, 2, 4))]


def test_get_waypoints_in_labware_arc() -> None:
    """It should use min_travel_z with well_z_margin to path in-labware arc."""
    result = get_waypoints(
        origin=Point(1, 1, 3),
        dest=Point(2, 2, 3),
        move_type=MoveType.IN_LABWARE_ARC,
        min_travel_z=5,
        max_travel_z=100,
    )

    assert result == [
        Waypoint(Point(1, 1, 10)),
        Waypoint(Point(2, 2, 10)),
        Waypoint(Point(2, 2, 3)),
    ]


def test_get_waypoints_in_labware_arc_with_high_dest() -> None:
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
        Waypoint(Point(1, 1, 11)),
        Waypoint(Point(2, 2, 11)),
    ]


def test_get_waypoints_in_labware_arc_with_high_origin() -> None:
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
        Waypoint(Point(2, 2, 11)),
        Waypoint(Point(2, 2, 10)),
    ]


def test_get_waypoints_in_labware_arc_with_extra_high_origin() -> None:
    """It should favor origin height over max travel z if higher."""
    result = get_waypoints(
        origin=Point(1, 1, 11),
        dest=Point(2, 2, 5),
        move_type=MoveType.IN_LABWARE_ARC,
        min_travel_z=6,
        # max_travel_z lower than starting point
        max_travel_z=10,
    )

    assert result == [
        Waypoint(Point(2, 2, 11)),
        Waypoint(Point(2, 2, 5)),
    ]


def test_get_waypoints_general_arc() -> None:
    """It should use the safe_z with lw_z_margin to path a general arc."""
    result = get_waypoints(
        origin=Point(1, 1, 3),
        dest=Point(2, 2, 3),
        move_type=MoveType.GENERAL_ARC,
        min_travel_z=5,
        max_travel_z=100,
    )

    assert result == [
        Waypoint(Point(1, 1, 15)),
        Waypoint(Point(2, 2, 15)),
        Waypoint(Point(2, 2, 3)),
    ]


def test_get_waypoints_general_arc_with_high_dest() -> None:
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
        Waypoint(Point(1, 1, 15)),
        Waypoint(Point(2, 2, 15)),
    ]


def test_get_waypoints_general_arc_with_high_origin() -> None:
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
        Waypoint(Point(2, 2, 15)),
        Waypoint(Point(2, 2, 14)),
    ]


def test_get_waypoints_with_extra_waypoints() -> None:
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
        Waypoint(Point(1, 1, 15)),
        Waypoint(Point(1, 1.5, 15)),
        Waypoint(Point(1.5, 1, 15)),
        Waypoint(Point(2, 2, 15)),
        Waypoint(Point(2, 2, 3)),
    ]


def test_get_waypoints_with_critical_points() -> None:
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
        Waypoint(Point(1, 1, 15), CP.XY_CENTER),
        Waypoint(Point(1, 1.5, 15), CP.FRONT_NOZZLE),
        Waypoint(Point(1.5, 1, 15), CP.FRONT_NOZZLE),
        Waypoint(Point(2, 2, 15), CP.FRONT_NOZZLE),
        Waypoint(Point(2, 2, 3), CP.FRONT_NOZZLE),
    ]


def test_get_waypoints_transitions_cp_with_high_dest() -> None:
    """It should ensure critical_points are blended when dest z is travel z."""
    result = get_waypoints(
        origin=Point(1, 1, 14),
        dest=Point(2, 2, 15),
        dest_cp=CP.XY_CENTER,
        move_type=MoveType.IN_LABWARE_ARC,
        # min_travel_z lower than to and from points
        min_travel_z=3,
        max_travel_z=100,
    )

    assert result == [
        Waypoint(Point(1, 1, 15)),
        Waypoint(Point(2, 2, 15), CP.XY_CENTER),
    ]


def test_get_waypoints_clamps_to_max_travel_z() -> None:
    """It should clamp the travel Z to max_travel_z if it has the clearance."""
    result = get_waypoints(
        origin=Point(1, 1, 3),
        dest=Point(2, 2, 3),
        move_type=MoveType.GENERAL_ARC,
        min_travel_z=5,
        max_travel_z=6,
    )

    assert result == [
        Waypoint(Point(1, 1, 6)),
        Waypoint(Point(2, 2, 6)),
        Waypoint(Point(2, 2, 3)),
    ]


def test_get_waypoints_raises_if_no_max_travel_z_clearance() -> None:
    """Raises ArcOutOfBoundsError if max_travel_z doesn't have clearance."""
    with pytest.raises(ArcOutOfBoundsError):
        get_waypoints(
            origin=Point(1, 1, 3),
            dest=Point(2, 2, 3),
            move_type=MoveType.GENERAL_ARC,
            min_travel_z=5,
            max_travel_z=5.9,
        )


def test_get_waypoints_raises_if_dest_has_no_clearance() -> None:
    """Raises DestinationOutOfBoundsError if dest z doesn't have clearance."""
    with pytest.raises(DestinationOutOfBoundsError):
        get_waypoints(
            origin=Point(1, 1, 3),
            dest=Point(2, 2, 5),
            move_type=MoveType.GENERAL_ARC,
            min_travel_z=5,
            max_travel_z=5.9,
        )


def test_get_waypoints_direct_moves_ignore_clearance_requirements() -> None:
    """It ignores clearance requirements for direct moves."""
    result = get_waypoints(
        origin=Point(1, 1, 3),
        dest=Point(1, 1, 5.5),
        move_type=MoveType.DIRECT,
        min_travel_z=5,
        max_travel_z=5.9,
    )

    assert result == [Waypoint(Point(1, 1, 5.5))]


def test_get_gripper_labware_movement_waypoints() -> None:
    """It should get the correct waypoints for gripper movement."""
    result = get_gripper_labware_movement_waypoints(
        from_labware_center=Point(101, 102, 119.5),
        to_labware_center=Point(201, 202, 219.5),
        gripper_home_z=999,
        offset_data=LabwareMovementOffsetData(
            pickUpOffset=LabwareOffsetVector(x=-1, y=-2, z=-3),
            dropOffset=LabwareOffsetVector(x=1, y=2, z=3),
        ),
    )
    assert result == [
        # move to above "from" slot
        GripperMovementWaypointsWithJawStatus(Point(100, 100, 999), False),
        # with jaw open, move to labware on "from" slot
        GripperMovementWaypointsWithJawStatus(Point(100, 100, 116.5), True),
        # grip labware and retract in place
        GripperMovementWaypointsWithJawStatus(Point(100, 100, 999), False),
        # with labware gripped, move to above "to" slot
        GripperMovementWaypointsWithJawStatus(Point(202.0, 204.0, 999), False),
        # with labware gripped, move down to labware drop height on "to" slot
        GripperMovementWaypointsWithJawStatus(Point(202.0, 204.0, 222.5), False),
        # ungrip labware and retract in place
        GripperMovementWaypointsWithJawStatus(Point(202.0, 204.0, 999), True),
    ]
