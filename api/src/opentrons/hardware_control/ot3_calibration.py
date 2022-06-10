"""Functions and utilites for OT3 calibration."""
from typing_extensions import Final, Literal
from math import copysign
from logging import getLogger
from .ot3api import OT3API
from .types import OT3Mount, OT3Axis
from opentrons.types import Point

LOG = getLogger(__name__)

CAL_TRANSIT_HEIGHT: Final[float] = 10


class EarlyCapacitiveSenseTrigger(RuntimeError):
    def __init__(self, triggered_at: float, nominal_point: float) -> None:
        super().__init__(
            f"Calibration triggered early at z={triggered_at}mm, "
            f"expected {nominal_point}"
        )


async def find_deck_position(hcapi: OT3API, mount: OT3Mount) -> float:
    """
    Find the true position of the deck in this mount's frame of reference.

    The deck nominal position in deck coordinates is 0 (that's part of the
    definition of deck coordinates) but if we have not yet calibrated a
    particular tool on a particular mount, then the z deck coordinate that
    will cause a collision is not 0. This routine finds that value.
    """
    z_offset_settings = hcapi.config.calibration.z_offset
    await hcapi.home_z()
    here = await hcapi.gantry_position(mount)
    LOG.info(f"my gantry position after home is {here}")
    z_prep_point = Point(*z_offset_settings.point)
    above_point = z_prep_point._replace(z=here.z)
    LOG.info(f"moving to {above_point}")
    await hcapi.move_to(mount, above_point)
    LOG.info("probing")
    deck_z = await hcapi.capacitive_probe(
        mount, OT3Axis.by_mount(mount), z_prep_point.z, z_offset_settings.pass_settings
    )
    LOG.info(f"autocalibration: found deck at {deck_z}")
    await hcapi.move_to(mount, z_prep_point + Point(0, 0, CAL_TRANSIT_HEIGHT))
    return deck_z


def _offset_in_axis(point: Point, offset: float, axis: OT3Axis) -> Point:
    if axis == OT3Axis.X:
        return point + Point(offset, 0, 0)
    if axis == OT3Axis.Y:
        return point + Point(0, offset, 0)
    raise KeyError(axis)


def _element_of_axis(point: Point, axis: OT3Axis) -> float:
    if axis == OT3Axis.X:
        return point.x
    if axis == OT3Axis.Y:
        return point.y
    raise KeyError(axis)


async def find_edge(
    hcapi: OT3API,
    mount: OT3Mount,
    slot_edge_nominal: Point,
    search_axis: OT3Axis,
    search_direction: Literal[1, -1],
) -> float:
    """
    Find the true position of one edge of the calibration slot in the deck.

    The nominal position of the calibration slots is known because they're
    machined into the deck, but if we haven't yet calibrated we won't know
    quite where they are. This routine finds the XY position that will
    place the calibration probe such that its center is in the slot, and
    one edge is on the edge of the slot.

    Params
    ------
    hcapi: The api instance to run commands through
    mount: The mount to calibrate
    slot_edge_nominal: The point describing the nominal position of the
        edge that we're checking. Its in-axis coordinate (i.e. its x coordinate
        for an x edge) should be the nominal position that we'll compare to. Its
        cross-axis coordiante (i.e. its y coordinate for an x edge) should be
        the point along the edge to search at, usually the midpoint. Its z-axis
        coordinate should be the current best estimate for the height of the deck.
    search_axis: The axis along which to search
    search_direction: The direction along which to search. This should be set
        such that it goes from on the deck to off the deck. For instance, on
        the minus y edge - the y-axis-aligned edge such that more negative
        y coordinates than the edge are on the deck, and more positive y coordinates
        than the edge are in the slot - the search direction should be +1.

    Returns
    -------
    The absolute position at which the center of the effector is inside the slot
    and its edge is aligned with the calibration slot edge.
    """
    here = await hcapi.gantry_position(mount)
    await hcapi.move_to(mount, here._replace(z=CAL_TRANSIT_HEIGHT))
    edge_settings = hcapi.config.calibration.edge_sense
    # Our first search position is at the nominal offset by our stride
    # against the search direction. That way we always start on the deck
    stride = edge_settings.search_initial_tolerance_mm * search_direction
    checking_pos = slot_edge_nominal + _offset_in_axis(
        Point(0, 0, 0), -stride, search_axis
    )
    # The first time we take a stride, we actually want it to be the full
    # specified initial tolerance. Since the way our loop works, we halve
    # the stride before we adjust the offset, we'll initially double our
    # stride (if we don't do that, we Zeno's Paradox ourselves)
    stride += edge_settings.search_initial_tolerance_mm * search_direction
    for _ in range(edge_settings.search_iteration_limit):
        LOG.info(f"Checking position {checking_pos}")
        check_prep = checking_pos._replace(z=CAL_TRANSIT_HEIGHT)
        await hcapi.move_to(mount, check_prep)
        interaction_pos = await hcapi.capacitive_probe(
            mount,
            OT3Axis.by_mount(mount),
            slot_edge_nominal.z,
            edge_settings.pass_settings,
        )
        await hcapi.move_to(mount, check_prep)
        if (
            interaction_pos
            > slot_edge_nominal.z + edge_settings.early_sense_tolerance_mm
        ):
            await hcapi.home_z()
            raise EarlyCapacitiveSenseTrigger(interaction_pos, slot_edge_nominal.z)
        if interaction_pos < (slot_edge_nominal.z - edge_settings.overrun_tolerance_mm):
            LOG.info(f"Miss at {interaction_pos}")
            # In this block, we've missed the deck
            if copysign(stride, search_direction) == stride:
                # if we're in our primary direction, from deck to not-deck, then we
                # need to reverse - this would be the first time we've missed the deck
                stride = -stride / 2
            else:
                # if we are against our primary direction, the last test was off the
                # deck too, so we want to continue
                stride = stride / 2
        else:
            LOG.info(f"hit at {interaction_pos}")
            # In this block, we've hit the deck
            if copysign(stride, search_direction) == stride:
                # If we're in our primary direction, the last probe was on the deck,
                # so we want to continue
                stride = stride / 2
            else:
                # if we're against our primary direction, the last probe missed,
                # so we want to switch back to narrow things down
                stride = -stride / 2
        checking_pos = _offset_in_axis(checking_pos, stride, search_axis)

    LOG.debug(
        f"Found edge {search_axis} direction {search_direction} at {checking_pos}"
    )
    return _element_of_axis(checking_pos, search_axis)


async def calibrate_mount(hcapi: OT3API, mount: OT3Mount) -> Point:
    """
    Run automatic calibration for the tool attached to the specified mount.

    Before running this function, make sure that the appropriate probe
    has been attached or prepped on the tool (for instance, a capacitive
    tip has been attached, or the conductive probe has been attached,
    or the probe has been lowered). The robot should be homed.

    Params
    ------
    hcapi: a hardware control api to run commands against
    mount: The mount to calibration

    Returns
    -------
    The estimated position of the XY center of the calibration slot in
    the plane of the deck. This value is suitable for vector-subtracting
    from the current instrument offset to set a new instrument offset.
    """
    # First, find the deck. This will become our z offset value, and will
    # also be used to baseline the edge detection points.
    z_pos = await find_deck_position(hcapi, mount)
    LOG.info(f"Found deck at {z_pos}mm")
    # Next, find all four edges of the calibration slot
    plus_x_edge = await find_edge(
        hcapi,
        mount,
        Point(*hcapi.config.calibration.edge_sense.plus_x_pos)._replace(z=z_pos),
        OT3Axis.X,
        -1,
    )
    LOG.info(f"Found +x edge at {plus_x_edge}mm")
    minus_x_edge = await find_edge(
        hcapi,
        mount,
        Point(*hcapi.config.calibration.edge_sense.minus_x_pos)._replace(z=z_pos),
        OT3Axis.X,
        1,
    )
    LOG.info(f"Found -x edge at {minus_x_edge}mm")
    plus_y_edge = await find_edge(
        hcapi,
        mount,
        Point(*hcapi.config.calibration.edge_sense.plus_y_pos)._replace(z=z_pos),
        OT3Axis.Y,
        -1,
    )
    LOG.info(f"Found +y edge at {plus_y_edge}mm")
    minus_y_edge = await find_edge(
        hcapi,
        mount,
        Point(*hcapi.config.calibration.edge_sense.minus_y_pos)._replace(z=z_pos),
        OT3Axis.Y,
        1,
    )
    LOG.info(f"Found -y edge at {minus_y_edge}mm")

    # The center of the calibration slot is the average of the edge positions
    # in-plane, and the absolute sense value out-of-plane
    center = Point(
        (plus_x_edge + minus_x_edge) / 2, (plus_y_edge + minus_y_edge) / 2, z_pos
    )
    LOG.info(f"Found calibration value {center} for mount {mount.name}")
    return center
