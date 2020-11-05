"""Waypoint planning."""
from typing import List, Optional, Sequence, Tuple
from typing_extensions import Final

from opentrons.types import Point
from opentrons.hardware_control.types import CriticalPoint

from .types import Waypoint, MoveType
from .errors import DestinationOutOfBoundsError, ArcOutOfBoundsError

DEFAULT_GENERAL_ARC_Z_MARGIN: Final[float] = 10.0
DEFAULT_IN_LABWARE_ARC_Z_MARGIN: Final[float] = 5.0
MINIMUM_Z_MARGIN: Final[float] = 1.0


def get_waypoints(
    origin: Point,
    dest: Point,
    *,
    max_travel_z: float,
    min_travel_z: float = 0.0,
    move_type: MoveType = MoveType.GENERAL_ARC,
    xy_waypoints: Sequence[Tuple[float, float]] = (),
    origin_cp: Optional[CriticalPoint] = None,
    dest_cp: Optional[CriticalPoint] = None,
) -> List[Waypoint]:
    """
    Get waypoints between an origin point and a destination point.

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
    # NOTE(mc, 2020-10-28): This function is currently experimental. Flipping
    # `use_experimental_waypoint_planning` to True in
    # `opentrons.protocols.geometry.plan_moves` causes three test failures at
    # the time of this writing.
    #
    # Eventually, it may take over for opentrons.hardware_control.util.plan_arc
    dest_waypoint = Waypoint(dest, dest_cp)
    waypoints: List[Waypoint] = []

    # a direct move can ignore all arc and waypoint planning
    if move_type == MoveType.DIRECT:
        return [dest_waypoint]

    # ensure destination is not out of bounds
    if dest.z + MINIMUM_Z_MARGIN > max_travel_z:
        raise DestinationOutOfBoundsError(
            origin=origin,
            dest=dest,
            clearance=MINIMUM_Z_MARGIN,
            min_travel_z=min_travel_z,
            max_travel_z=max_travel_z,
            message="Destination out of bounds in the Z-axis"
        )

    # ensure that the passed in min_travel_z and max_travel_z are compatible
    if min_travel_z + MINIMUM_Z_MARGIN > max_travel_z:
        raise ArcOutOfBoundsError(
            origin=origin,
            dest=dest,
            clearance=MINIMUM_Z_MARGIN,
            min_travel_z=min_travel_z,
            max_travel_z=max_travel_z,
            message="Arc out of bounds in the Z-axis"
        )

    # set the z clearance according to the arc type
    travel_z_margin = (
        DEFAULT_GENERAL_ARC_Z_MARGIN
        if move_type == MoveType.GENERAL_ARC
        else DEFAULT_IN_LABWARE_ARC_Z_MARGIN
    )

    # set the actual travel z according to:
    # use the max of min_travel_z with clearance, origin height, or dest height
    # if any of those exceed max_travel_z, just use max_travel_z
    # if max_travel_z does not provide enough clearance, check above would
    # raise an ArcOutOfBoundsError
    travel_z = min(
        max_travel_z,
        max(min_travel_z + travel_z_margin, origin.z, dest.z)
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
