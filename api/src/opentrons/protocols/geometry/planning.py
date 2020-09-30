import functools
import logging
from dataclasses import dataclass
from typing import List, Optional, Tuple

from opentrons import types
from opentrons.hardware_control.types import CriticalPoint
from opentrons.hardware_control.util import plan_arc
from opentrons.protocol_api.labware import (
    Labware, Well, quirks_from_any_parent)
from opentrons.protocols.geometry.deck import Deck
from opentrons.protocols.geometry.module_geometry import (
    ThermocyclerGeometry, ModuleGeometry)
from opentrons.protocols.api_support.util import first_parent


MODULE_LOG = logging.getLogger(__name__)


class LabwareHeightError(Exception):
    pass


def max_many(*args):
    return functools.reduce(max, args[1:], args[0])


def split_loc_labware(
        loc: types.Location) -> Tuple[Optional[Labware], Optional[Well]]:
    if isinstance(loc.labware, Labware):
        return loc.labware, None
    elif isinstance(loc.labware, Well):
        return loc.labware.parent, loc.labware
    else:
        return None, None


BAD_PAIRS = [('1', '12'),
             ('12', '1'),
             ('4', '12'),
             ('12', '4'),
             ('4', '9'),
             ('9', '4'),
             ('4', '8'),
             ('8', '4'),
             ('1', '8'),
             ('8', '1'),
             ('4', '11'),
             ('11', '4'),
             ('1', '11'),
             ('11', '1')]


def should_dodge_thermocycler(
        deck: Deck,
        from_loc: types.Location,
        to_loc: types.Location) -> bool:
    """
    Decide if the requested path would cross the thermocycler, if
    installed.

    Returns True if we need to dodge, False otherwise
    """
    if any([isinstance(item, ThermocyclerGeometry) for item in deck.values()]):
        transit = (first_parent(from_loc.labware),
                   first_parent(to_loc.labware))
        # mypy doesn't like this because transit could be none, but it's
        # checked by value in BAD_PAIRS which has only strings
        return transit in BAD_PAIRS

    return False


@dataclass
class MoveConstraints:
    instr_max_height: float
    well_z_margin: float = 5.0
    lw_z_margin: float = 10.0
    minimum_lw_z_margin: float = 1.0
    minimum_z_height: float = 0.0

    @classmethod
    def build(cls, **kwargs):
        return cls(**{k: v for k, v in kwargs.items() if v is not None})


def safe_height(
        from_loc: types.Location,
        to_loc: types.Location,
        deck: Deck,
        instr_max_height: float,
        well_z_margin: float = None,
        lw_z_margin: float = None,
        minimum_lw_z_margin: float = None,
        minimum_z_height: float = None,) -> float:
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
        minimum_z_height=minimum_z_height)
    assert constraints.minimum_z_height >= 0.0
    return _build_safe_height(from_loc, to_loc, deck, constraints)


def _build_safe_height(from_loc: types.Location,
                       to_loc: types.Location,
                       deck: Deck,
                       constraints: MoveConstraints) -> float:
    to_point = to_loc.point
    to_lw, to_well = split_loc_labware(to_loc)
    from_point = from_loc.point
    from_lw, from_well = split_loc_labware(from_loc)

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
            if constraints.instr_max_height\
               >= (deck.highest_z + constraints.minimum_lw_z_margin):
                to_safety = constraints.instr_max_height
            else:
                tallest_lw = list(filter(
                    lambda lw: lw.highest_z == deck.highest_z,
                    [lw for lw in deck.data.values() if lw]))[0]
                if isinstance(tallest_lw, ModuleGeometry) and\
                        tallest_lw.labware:
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
                    "definitions and calibrations.")
        from_safety = 0.0  # (ignore since it’s in a max())

    return max_many(
        to_point.z,
        from_point.z,
        to_safety,
        from_safety,
        constraints.minimum_z_height)


def plan_moves(
        from_loc: types.Location,
        to_loc: types.Location,
        deck: Deck,
        instr_max_height: float,
        well_z_margin: float = None,
        lw_z_margin: float = None,
        force_direct: bool = False,
        minimum_lw_z_margin: float = None,
        minimum_z_height: float = None,)\
        -> List[Tuple[types.Point,
                      Optional[CriticalPoint]]]:
    """ Plan moves between one :py:class:`.Location` and another.

    Each :py:class:`.Location` instance might or might not have a specific
    kind of geometry attached. This function is intended to return series
    of moves that contain the minimum safe retractions to avoid (known)
    labware on the specified :py:class:`Deck`.
    :param from_loc: The last location.
    :param to_loc: The location to move to.
    :param deck: The :py:class:`Deck` instance describing the robot.
    :param force_direct: If True, ignore any Z margins force a direct move

    The other parameters are as :py:meth:`safe_height`.

    :returns: A list of tuples of :py:class:`.Point` and critical point
              overrides to move through.
    """
    constraints = MoveConstraints.build(
        instr_max_height=instr_max_height,
        well_z_margin=well_z_margin,
        lw_z_margin=lw_z_margin,
        minimum_lw_z_margin=minimum_lw_z_margin,
        minimum_z_height=minimum_z_height)
    assert constraints.minimum_z_height >= 0.0

    to_point = to_loc.point
    to_lw, to_well = split_loc_labware(to_loc)
    from_point = from_loc.point
    from_lw, from_well = split_loc_labware(from_loc)
    dest_quirks = quirks_from_any_parent(to_lw)
    from_quirks = quirks_from_any_parent(from_lw)
    from_center = 'centerMultichannelOnWells' in from_quirks
    to_center = 'centerMultichannelOnWells' in dest_quirks
    dest_cp_override = CriticalPoint.XY_CENTER if to_center else None
    origin_cp_override = CriticalPoint.XY_CENTER if from_center else None

    is_same_location = ((to_lw and to_lw == from_lw)
                        and (to_well and to_well == from_well))
    if (force_direct or (is_same_location and not
                         (minimum_z_height or 0) > 0)):
        # If we’re going direct, we can assume we’re already in the correct
        # cp so we can use the override without prep
        return [(to_point, dest_cp_override)]

    # Generate arc moves

    # Find the safe z heights based on the destination and origin labware/well
    safe = _build_safe_height(from_loc, to_loc, deck, constraints)
    must_dodge = should_dodge_thermocycler(deck, from_loc, to_loc)
    if must_dodge:
        sc = deck.get_slot_center('5')
        wp = [(sc.x, sc.y)]
    else:
        wp = []
    return plan_arc(from_point, to_point, safe,
                    origin_cp_override, dest_cp_override,
                    wp)
