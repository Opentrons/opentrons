import functools
import logging
from dataclasses import dataclass
from typing import List, Optional, Tuple

from opentrons import types
from opentrons.hardware_control.types import CriticalPoint
from opentrons.hardware_control.util import plan_arc

from opentrons.motion_planning import (
    DEFAULT_GENERAL_ARC_Z_MARGIN,
    DEFAULT_IN_LABWARE_ARC_Z_MARGIN,
    MINIMUM_Z_MARGIN,
    MoveType,
    get_waypoints,
)

from opentrons.protocols.api_support.labware_like import LabwareLike
from opentrons.protocol_api.core.legacy.deck import Deck
from opentrons.protocol_api.core.legacy.module_geometry import ModuleGeometry


MODULE_LOG = logging.getLogger(__name__)


class LabwareHeightError(Exception):
    pass


def max_many(*args):
    return functools.reduce(max, args[1:], args[0])


BAD_PAIRS = {
    ("1", "12"),
    ("12", "1"),
    ("4", "12"),
    ("12", "4"),
    ("4", "9"),
    ("9", "4"),
    ("4", "8"),
    ("8", "4"),
    ("1", "8"),
    ("8", "1"),
    ("4", "11"),
    ("11", "4"),
    ("1", "11"),
    ("11", "1"),
}


def should_dodge_thermocycler(
    deck: Deck, from_loc: types.Location, to_loc: types.Location
) -> bool:
    """
    Decide if the requested path would cross the thermocycler, if
    installed.

    Returns True if we need to dodge, False otherwise
    """
    if deck.thermocycler_present:
        transit = (from_loc.labware.first_parent(), to_loc.labware.first_parent())
        # mypy doesn't like this because transit could be none, but it's
        # checked by value in BAD_PAIRS which has only strings
        return transit in BAD_PAIRS

    return False


@dataclass
class MoveConstraints:
    instr_max_height: float
    well_z_margin: float = DEFAULT_IN_LABWARE_ARC_Z_MARGIN
    lw_z_margin: float = DEFAULT_GENERAL_ARC_Z_MARGIN
    minimum_lw_z_margin: float = MINIMUM_Z_MARGIN
    minimum_z_height: float = 0.0

    @classmethod
    def build(cls, **kwargs):
        return cls(**{k: v for k, v in kwargs.items() if v is not None})


def get_move_type(
    from_loc: types.Location,
    to_loc: types.Location,
    force_direct: bool = False,
) -> MoveType:
    """Given two Locations, return the type of move."""
    move_type = MoveType.GENERAL_ARC
    from_labware, from_well = from_loc.labware.get_parent_labware_and_well()
    to_labware, to_well = to_loc.labware.get_parent_labware_and_well()
    same_labware = to_labware is not None and to_labware == from_labware
    same_well = to_well is not None and to_well == from_well

    if same_labware:
        move_type = MoveType.DIRECT if same_well else MoveType.IN_LABWARE_ARC

    return move_type if not force_direct else MoveType.DIRECT


def safe_height(
    from_loc: types.Location,
    to_loc: types.Location,
    deck: Deck,
    instr_max_height: float,
    well_z_margin: float = None,
    lw_z_margin: float = None,
    minimum_lw_z_margin: float = None,
    minimum_z_height: float = None,
) -> float:
    """
    Derive the height required to clear the current deck setup along
    with other constraints
    :param from_loc: The last location.
    :param to_loc: The location to move to.
    :param deck: The :py:class:`Deck` instance describing the robot.
    :param float instr_max_height: The highest z location this pipette can
                                   achieve
    :param float well_z_margin: How much extra Z margin to raise the cp by over
                                the bare minimum to clear wells within the same
                                labware. Default: 5mm
    :param float lw_z_margin: How much extra Z margin to raise the cp by over
                              the bare minimum to clear different pieces of
                              labware.
    :param minimum_z_height: When specified, this Z margin is able to raise
                             (but never lower) the mid-arc height.
    """
    constraints = MoveConstraints.build(
        instr_max_height=instr_max_height,
        well_z_margin=well_z_margin,
        lw_z_margin=lw_z_margin,
        minimum_lw_z_margin=minimum_lw_z_margin,
        minimum_z_height=minimum_z_height,
    )
    assert constraints.minimum_z_height >= 0.0
    return _build_safe_height(from_loc, to_loc, deck, constraints)


def _build_safe_height(
    from_loc: types.Location,
    to_loc: types.Location,
    deck: Deck,
    constraints: MoveConstraints,
) -> float:
    to_point = to_loc.point
    to_lw, to_well = to_loc.labware.get_parent_labware_and_well()
    from_point = from_loc.point
    from_lw, from_well = from_loc.labware.get_parent_labware_and_well()

    if to_lw and to_lw == from_lw:
        # If we know the labwares we’re moving from and to, we can calculate
        # a safe z based on their heights
        if to_well:
            to_safety = to_well.top().point.z + constraints.well_z_margin
        else:
            to_safety = to_lw.highest_z + constraints.well_z_margin
        if from_well:
            from_safety = from_well.top().point.z + constraints.well_z_margin
        else:
            from_safety = from_lw.highest_z + constraints.well_z_margin
        # if we are already at the labware, we know the instr max height would
        # be tall enough
        if max(from_safety, to_safety) > constraints.instr_max_height:
            to_safety = constraints.instr_max_height
            from_safety = 0.0  # (ignore since it's in a max())
    else:
        # One of our labwares is invalid so we have to just go above
        # deck.highest_z since we don’t know where we are
        to_safety = deck.highest_z + constraints.lw_z_margin

        if to_safety > constraints.instr_max_height:
            if constraints.instr_max_height >= (
                deck.highest_z + constraints.minimum_lw_z_margin
            ):
                to_safety = constraints.instr_max_height
            else:
                tallest_lw = list(
                    filter(
                        lambda lw: lw.highest_z == deck.highest_z,
                        [lw for lw in deck.data.values() if lw],
                    )
                )[0]
                if isinstance(tallest_lw, ModuleGeometry) and tallest_lw.labware:
                    tallest_lw = tallest_lw.labware
                raise LabwareHeightError(
                    f"The {tallest_lw} has a total height of {deck.highest_z}"
                    " mm, which is too tall for your current pipette "
                    "configurations. The longest pipette on your robot can "
                    f"only be raised to {constraints.instr_max_height} mm "
                    "above the deck. "
                    "This may be because the labware is incorrectly defined, "
                    "incorrectly calibrated, or physically too tall. This "
                    "could also be caused by the pipette and its tipracks "
                    "being mismatched. Please check your protocol, labware "
                    "definitions and calibrations."
                )
        from_safety = 0.0  # (ignore since it’s in a max())

    return max_many(
        to_point.z, from_point.z, to_safety, from_safety, constraints.minimum_z_height
    )


def plan_moves(
    from_loc: types.Location,
    to_loc: types.Location,
    deck: Deck,
    instr_max_height: float,
    well_z_margin: float = None,
    lw_z_margin: float = None,
    force_direct: bool = False,
    minimum_lw_z_margin: float = None,
    minimum_z_height: float = None,
    use_experimental_waypoint_planning: bool = False,
) -> List[Tuple[types.Point, Optional[CriticalPoint]]]:
    """Plan moves between one :py:class:`.Location` and another.

    Each :py:class:`.Location` instance might or might not have a specific
    kind of geometry attached. This function is intended to return series
    of moves that contain the minimum safe retractions to avoid (known)
    labware on the specified :py:class:`Deck`.
    :param from_loc: The last location.
    :param to_loc: The location to move to.
    :param deck: The :py:class:`Deck` instance describing the robot.
    :param force_direct: If True, ignore any Z margins force a direct move
    :param use_experimental_waypoint_planning: If True, use waypoint logic
                                               from opentrons.motion_planning

    The other parameters are as :py:meth:`safe_height`.

    :returns: A list of tuples of :py:class:`.Point` and critical point
              overrides to move through.
    """
    constraints = MoveConstraints.build(
        instr_max_height=instr_max_height,
        well_z_margin=well_z_margin,
        lw_z_margin=lw_z_margin,
        minimum_lw_z_margin=minimum_lw_z_margin,
        minimum_z_height=minimum_z_height,
    )
    assert constraints.minimum_z_height >= 0.0

    to_point = to_loc.point
    to_lw, to_well = to_loc.labware.get_parent_labware_and_well()
    from_point = from_loc.point
    from_lw, from_well = from_loc.labware.get_parent_labware_and_well()
    from_center = LabwareLike(from_lw).center_multichannel_on_wells()
    to_center = LabwareLike(to_lw).center_multichannel_on_wells()
    dest_cp_override = CriticalPoint.XY_CENTER if to_center else None
    origin_cp_override = CriticalPoint.XY_CENTER if from_center else None
    extra_waypoints = []

    if should_dodge_thermocycler(deck, from_loc, to_loc):
        sc = deck.get_slot_center("5")
        extra_waypoints = [(sc.x, sc.y)]

    if use_experimental_waypoint_planning:
        move_type = get_move_type(from_loc, to_loc, force_direct)
        min_travel_z = deck.highest_z

        if to_lw is not None and move_type == MoveType.IN_LABWARE_ARC:
            min_travel_z = to_lw.highest_z

        # TODO(mc, 2020-11-05): if this ever needs to be used, we need a
        # story to re-create error messaging from LabwareHeightError above if
        # this raises a MotionPlanningError
        waypoints = get_waypoints(
            origin=from_point,
            dest=to_point,
            min_travel_z=min_travel_z,
            max_travel_z=instr_max_height,
            move_type=move_type,
            xy_waypoints=extra_waypoints,
            origin_cp=origin_cp_override,
            dest_cp=dest_cp_override,
        )
        return [(wp.position, wp.critical_point) for wp in waypoints]

    is_same_location = (to_lw and to_lw == from_lw) and (
        to_well and to_well == from_well
    )
    if force_direct or (is_same_location and not (minimum_z_height or 0) > 0):
        # If we’re going direct, we can assume we’re already in the correct
        # cp so we can use the override without prep
        return [(to_point, dest_cp_override)]

    # Find the safe z heights based on the destination and origin labware/well
    safe = _build_safe_height(from_loc, to_loc, deck, constraints)

    return plan_arc(
        from_point,
        to_point,
        safe,
        origin_cp_override,
        dest_cp_override,
        extra_waypoints,
    )
