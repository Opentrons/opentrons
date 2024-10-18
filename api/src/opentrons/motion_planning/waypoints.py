"""Waypoint planning."""
from typing import List, Optional, Sequence, Tuple
from typing_extensions import Final

from opentrons.types import Point
from opentrons.hardware_control.types import CriticalPoint

from .types import Waypoint, MoveType, GripperMovementWaypointsWithJawStatus
from .errors import DestinationOutOfBoundsError, ArcOutOfBoundsError
from ..protocol_engine.types import LabwareMovementOffsetData

DEFAULT_GENERAL_ARC_Z_MARGIN: Final[float] = 10.0
DEFAULT_IN_LABWARE_ARC_Z_MARGIN: Final[float] = 5.0
MINIMUM_Z_MARGIN: Final[float] = 1.0


def get_waypoints(
    origin: Point,
    dest: Point,
    *,
    max_travel_z: float,
    min_travel_z: float,
    move_type: MoveType = MoveType.GENERAL_ARC,
    xy_waypoints: Sequence[Tuple[float, float]] = (),
    origin_cp: Optional[CriticalPoint] = None,
    dest_cp: Optional[CriticalPoint] = None,
) -> List[Waypoint]:
    """Get waypoints between an origin point and a destination point.

    Given a move type and Z limits, which should be calculated according to
    deck / labware / pipette geometry, creates waypoints with proper
    z-clearances to move between `origin` and `dest`.

    :param origin: The start point of the move.
    :param dest: The end point of the move.
    :param max_travel_z: The maximum allowed travel height of an arc move.
    :param min_travel_z: The minimum allowed travel height of an arc move.
    :param move_type: Direct move, in-labware arc, or general arc move type.
    :param xy_waypoints: Extra XY destination waypoints to place in the path.
    :param origin_cp: Pipette critical point override for origin waypoints.
    :param dest_cp: Pipette critical point override for destination waypoints.

    :returns: A list of :py:class:`.Waypoint` locations to move through.
    """
    # NOTE(mm, 2022-06-22):
    # This function is used by v6+ JSON protocols and v3+
    # Python API protocols, but not v2 Python API protocols.
    #
    # To experiment with using this module in PAPIv2,
    # flip the default of `use_experimental_waypoint_planning` to True
    # in opentrons.protocols.geometry.planning.plan_moves
    dest_waypoint = Waypoint(dest, dest_cp)
    waypoints: List[Waypoint] = []

    # a direct move can ignore all arc and waypoint planning
    if move_type == MoveType.DIRECT:
        # TODO(mm, 2022-06-17): This will not raise an out-of-bounds error
        # even if the destination is far out of bounds. A protocol can run into this by
        # doing a direct move to bad coordinates. Should we raise in that case?
        return [dest_waypoint]

    # ensure destination is not out of bounds
    if dest.z + MINIMUM_Z_MARGIN > max_travel_z:
        raise DestinationOutOfBoundsError(
            origin=origin,
            dest=dest,
            clearance=MINIMUM_Z_MARGIN,
            min_travel_z=min_travel_z,
            max_travel_z=max_travel_z,
            message="Destination out of bounds in the Z-axis",
        )

    # ensure that the passed in min_travel_z and max_travel_z are compatible
    if min_travel_z + MINIMUM_Z_MARGIN > max_travel_z:
        raise ArcOutOfBoundsError(
            origin=origin,
            dest=dest,
            clearance=MINIMUM_Z_MARGIN,
            min_travel_z=min_travel_z,
            max_travel_z=max_travel_z,
            message="Arc out of bounds in the Z-axis",
        )

    # set the z clearance according to the arc type
    travel_z_margin = (
        DEFAULT_GENERAL_ARC_Z_MARGIN
        if move_type == MoveType.GENERAL_ARC
        else DEFAULT_IN_LABWARE_ARC_Z_MARGIN
    )

    # set the actual travel z according to:
    # use the max of min_travel_z with clearance or dest height
    # if either of those exceed max_travel_z, just use max_travel_z
    # if max_travel_z does not provide enough clearance, check above would
    # raise an ArcOutOfBoundsError
    # if origin.z is higher than the selected travel z, travel at origin.z instead
    travel_z = max(
        min(max_travel_z, max(min_travel_z + travel_z_margin, dest.z)),
        origin.z,
    )

    # if origin.z isn't the travel height: add waypoint to move to origin.z
    if travel_z > origin.z:
        waypoints.append(Waypoint(origin._replace(z=travel_z), origin_cp))

    # add any additional waypoints along with critical point blending
    # see https://github.com/Opentrons/opentrons/pull/5662
    # TODO(mc, 2020-11-05): if any critical point transitions can move in the
    # Z axis, an extra waypoint for that transition will be needed
    for x, y in xy_waypoints:
        waypoints.append(Waypoint(Point(x=x, y=y, z=travel_z), dest_cp))

    # if dest.z isn't the travel height: add waypoint to move to dest.z
    # TODO(mc, 2020-11-05): if any critical point transitions can move in the
    # Z axis, this conditional will need to be revised
    if travel_z > dest.z:
        waypoints.append(Waypoint(dest._replace(z=travel_z), dest_cp))

    waypoints.append(dest_waypoint)

    return waypoints


def get_gripper_labware_movement_waypoints(
    from_labware_center: Point,
    to_labware_center: Point,
    gripper_home_z: float,
    offset_data: LabwareMovementOffsetData,
    post_drop_slide_offset: Optional[Point],
) -> List[GripperMovementWaypointsWithJawStatus]:
    """Get waypoints for moving labware using a gripper."""
    pick_up_offset = offset_data.pickUpOffset
    drop_offset = offset_data.dropOffset

    pick_up_location = from_labware_center + Point(
        pick_up_offset.x, pick_up_offset.y, pick_up_offset.z
    )
    drop_location = to_labware_center + Point(
        drop_offset.x, drop_offset.y, drop_offset.z
    )

    post_drop_home_pos = Point(drop_location.x, drop_location.y, gripper_home_z)

    waypoints_with_jaw_status = [
        GripperMovementWaypointsWithJawStatus(
            position=Point(pick_up_location.x, pick_up_location.y, gripper_home_z),
            jaw_open=False,
            dropping=False,
        ),
        GripperMovementWaypointsWithJawStatus(
            position=pick_up_location, jaw_open=True, dropping=False
        ),
        # Gripper grips the labware here
        GripperMovementWaypointsWithJawStatus(
            position=Point(pick_up_location.x, pick_up_location.y, gripper_home_z),
            jaw_open=False,
            dropping=False,
        ),
        GripperMovementWaypointsWithJawStatus(
            position=Point(drop_location.x, drop_location.y, gripper_home_z),
            jaw_open=False,
            dropping=False,
        ),
        GripperMovementWaypointsWithJawStatus(
            position=drop_location, jaw_open=False, dropping=False
        ),
        # Gripper ungrips here
        GripperMovementWaypointsWithJawStatus(
            position=post_drop_home_pos,
            jaw_open=True,
            dropping=True,
        ),
    ]
    if post_drop_slide_offset is not None:
        # IF it is specified, add one more step after homing the gripper
        waypoints_with_jaw_status.append(
            GripperMovementWaypointsWithJawStatus(
                position=post_drop_home_pos + post_drop_slide_offset,
                jaw_open=True,
                dropping=False,
            )
        )
    return waypoints_with_jaw_status


def get_gripper_labware_placement_waypoints(
    to_labware_center: Point,
    gripper_home_z: float,
    drop_offset: Optional[Point],
) -> List[GripperMovementWaypointsWithJawStatus]:
    """Get waypoints for placing labware using a gripper."""
    drop_offset = drop_offset or Point()

    drop_location = to_labware_center + Point(
        drop_offset.x, drop_offset.y, drop_offset.z
    )

    post_drop_home_pos = Point(drop_location.x, drop_location.y, gripper_home_z)

    return [
        GripperMovementWaypointsWithJawStatus(
            position=Point(drop_location.x, drop_location.y, gripper_home_z),
            jaw_open=False,
            dropping=False,
        ),
        GripperMovementWaypointsWithJawStatus(
            position=drop_location, jaw_open=False, dropping=False
        ),
        # Gripper ungrips here
        GripperMovementWaypointsWithJawStatus(
            position=post_drop_home_pos,
            jaw_open=True,
            dropping=True,
        ),
    ]
