"""Functions and utilites for OT3 calibration."""
from __future__ import annotations
from typing_extensions import Final, Literal, TYPE_CHECKING
from typing import Union, Tuple, List, Dict, Any, Optional
import datetime
import numpy as np
from enum import Enum
from math import copysign, floor
from logging import getLogger

from .types import OT3Mount, OT3Axis
from opentrons.types import Point
import json

if TYPE_CHECKING:
    from .ot3api import OT3API

LOG = getLogger(__name__)

CAL_TRANSIT_HEIGHT: Final[float] = 10


class CalibrationMethod(Enum):
    BINARY_SEARCH = "binary search"
    NONCONTACT_PASS = "noncontact pass"


class EarlyCapacitiveSenseTrigger(RuntimeError):
    def __init__(self, triggered_at: float, nominal_point: float) -> None:
        super().__init__(
            f"Calibration triggered early at z={triggered_at}mm, "
            f"expected {nominal_point}"
        )


class InaccurateNonContactSweepError(RuntimeError):
    def __init__(self, nominal_width: float, detected_width: float) -> None:
        super().__init__(
            f"Calibration detected a slot width of {detected_width:.3f}mm "
            f"which is too far from the design width of {nominal_width:.3f}mm"
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
    z_prep_point = Point(*z_offset_settings.point)
    above_point = z_prep_point._replace(z=here.z)
    await hcapi.move_to(mount, above_point)
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
    search_axis: Union[Literal[OT3Axis.X, OT3Axis.Y]],
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


async def find_slot_center_binary(
    hcapi: OT3API, mount: OT3Mount, deck_height: float
) -> Tuple[float, float]:
    """Find the center of the calibration slot by binary-searching its edges.

    Returns the XY-center of the slot.
    """
    # Find all four edges of the calibration slot
    plus_x_edge = await find_edge(
        hcapi,
        mount,
        Point(*hcapi.config.calibration.edge_sense.plus_x_pos)._replace(z=deck_height),
        OT3Axis.X,
        -1,
    )
    LOG.info(f"Found +x edge at {plus_x_edge}mm")
    minus_x_edge = await find_edge(
        hcapi,
        mount,
        Point(*hcapi.config.calibration.edge_sense.minus_x_pos)._replace(z=deck_height),
        OT3Axis.X,
        1,
    )
    LOG.info(f"Found -x edge at {minus_x_edge}mm")
    plus_y_edge = await find_edge(
        hcapi,
        mount,
        Point(*hcapi.config.calibration.edge_sense.plus_y_pos)._replace(z=deck_height),
        OT3Axis.Y,
        -1,
    )
    LOG.info(f"Found +y edge at {plus_y_edge}mm")
    minus_y_edge = await find_edge(
        hcapi,
        mount,
        Point(*hcapi.config.calibration.edge_sense.minus_y_pos)._replace(z=deck_height),
        OT3Axis.Y,
        1,
    )
    LOG.info(f"Found -y edge at {minus_y_edge}mm")
    return (plus_x_edge + minus_x_edge) / 2, (plus_y_edge + minus_y_edge) / 2


async def find_axis_center(
    hcapi: OT3API,
    mount: OT3Mount,
    minus_edge_nominal: Point,
    plus_edge_nominal: Point,
    axis: Union[Literal[OT3Axis.X, OT3Axis.Y]],
) -> float:
    """Find the center of the calibration slot on the specified axis.

    Sweep from the specified left edge to the specified right edge while taking
    capacitive sense data. When the probe is over the deck, the capacitance will
    be higher than when the probe is over the slot. By postprocessing the data,
    we determine where the slot edges are, and return those positions.
    """
    WIDTH_TOLERANCE_MM: float = 0.5
    here = await hcapi.gantry_position(mount)
    await hcapi.move_to(mount, here._replace(z=CAL_TRANSIT_HEIGHT))
    edge_settings = hcapi.config.calibration.edge_sense

    start = axis.set_in_point(
        minus_edge_nominal,
        axis.of_point(minus_edge_nominal) - edge_settings.search_initial_tolerance_mm,
    )
    end = axis.set_in_point(
        plus_edge_nominal,
        axis.of_point(plus_edge_nominal) + edge_settings.search_initial_tolerance_mm,
    )

    await hcapi.move_to(mount, start._replace(z=CAL_TRANSIT_HEIGHT))

    data = await hcapi.capacitive_sweep(
        mount, axis, start, end, edge_settings.pass_settings.speed_mm_per_s
    )

    left_edge, right_edge = _edges_from_data(
        data,
        axis.of_point(end) - axis.of_point(start),
        {
            "axis": axis.name,
            "speed": edge_settings.pass_settings.speed_mm_per_s,
            "start_absolute": axis.of_point(start),
            "end_absolute": axis.of_point(end),
        },
    )
    nominal_width = axis.of_point(plus_edge_nominal) - axis.of_point(minus_edge_nominal)
    detected_width = right_edge - left_edge
    left_edge_absolute = axis.of_point(start) + left_edge
    right_edge_absolute = axis.of_point(start) + right_edge
    if abs(detected_width - nominal_width) > WIDTH_TOLERANCE_MM:
        raise InaccurateNonContactSweepError(nominal_width, detected_width)
    return (left_edge_absolute + right_edge_absolute) / 2


def _edges_from_data(
    data: List[float], distance: float, log_metadata: Optional[Dict[str, Any]] = None
) -> Tuple[float, float]:
    """
    Postprocess the capacitance data taken from a sweep to find the calibration slot.

    The sweep should have covered both edges, going off the deck into the slot,
    all the way across the slot, and back onto the deck on the other side.

    Capacitance is proportional to the area of the "plates" involved in the sensing. To
    a first approximation, these are the flat circular face of the bottom of the probe,
    and the deck. When the probe begins to cross the edge of the deck, the area of the
    second "plate" - the deck - ends abruptly, in a straight line transverse to motion.
    As the probe crosses, less and less of that circular face is over the deck.

    That means that the rate of change with respect to the overlap distance (or time, at
    constant velocity) is maximized as the center of the probe passes the edge of the
    deck.

    We can therefore apply a combined smoothing and differencing convolution kernel to
    the timeseries data and set the locations of the edges as the locations of the
    extrema of the difference of the series.
    """
    now_str = datetime.datetime.now().strftime("%d-%m-%y-%H:%M:%S")

    # The width of the averaging kernel defines how strong the averaging is - a wider
    # kernel, or filter, has a lower rolloff frequency and will smooth more. This
    # calculation sets the width at 5% of the length of the data, and then makes that
    # value an even number
    average_width_samples = (int(floor(0.05 * len(data))) // 2) * 2
    # an averaging kernel would be an array of length N with elements each set to 1/N;
    # when convolved with a data stream, this will (ignoring edge effects) produce
    # an N-sample rolling average. by inverting the sign of half the kernel, which is
    # why we need it to be even, we do the same thing but while also taking a finite
    # difference.
    average_difference_kernel = np.concatenate(  # type: ignore
        (
            np.full(average_width_samples // 2, 1 / average_width_samples),
            np.full(average_width_samples // 2, -1 / average_width_samples),
        )
    )
    differenced = np.convolve(np.array(data), average_difference_kernel, mode="valid")
    # These are the indices of the minimum difference (which should be the left edge,
    # where the probe is halfway through moving off the deck, and the slope of the
    # data is most negative) and the maximum difference (which should be the right
    # edge, where the probe is halfway through moving back onto the deck, and the slope
    # of the data is most positive)
    left_edge_sample = np.argmin(differenced)
    right_edge_sample = np.argmax(differenced)
    mm_per_elem = distance / len(data)
    # The differenced data is shorter than the input data because we used valid outputs
    # of the convolution only to avoid edge effects; that means we need to account for
    # the distance in the cut-off data
    distance_prefix = ((len(data) - len(differenced)) / 2) * mm_per_elem
    left_edge_offset = left_edge_sample * mm_per_elem
    left_edge = left_edge_offset + distance_prefix
    right_edge_offset = right_edge_sample * mm_per_elem
    right_edge = right_edge_offset + distance_prefix
    json.dump(
        {
            "metadata": log_metadata,
            "inputs": {
                "raw_data": data,
                "distance": distance,
                "kernel_width": len(average_difference_kernel),
            },
            "outputs": {
                "differenced_data": [d for d in differenced],
                "mm_per_elem": mm_per_elem,
                "distance_prefix": distance_prefix,
                "right_edge_offset": right_edge_offset,
                "left_edge_offset": left_edge_offset,
                "left_edge": left_edge,
                "right_edge": right_edge,
            },
        },
        open(f"/data/sweep_{now_str}.json", "w"),
    )
    LOG.info(
        f"Found edges ({left_edge:.3f}, {right_edge:.3f}) "
        f"from offsets ({left_edge_offset:.3f}, {right_edge_offset:.3f}) "
        f"with {len(data)} cap samples over {distance}mm "
        f"using a kernel width of {len(average_difference_kernel)}"
    )
    return float(left_edge), float(right_edge)


async def find_slot_center_noncontact(
    hcapi: OT3API, mount: OT3Mount, deck_height: float
) -> Tuple[float, float]:
    NONCONTACT_INTERVAL_MM: float = 0.1
    target_z = deck_height + NONCONTACT_INTERVAL_MM
    x_center = await find_axis_center(
        hcapi,
        mount,
        Point(*hcapi.config.calibration.edge_sense.minus_x_pos)._replace(z=target_z),
        Point(*hcapi.config.calibration.edge_sense.plus_x_pos)._replace(z=target_z),
        OT3Axis.X,
    )
    y_center = await find_axis_center(
        hcapi,
        mount,
        Point(*hcapi.config.calibration.edge_sense.minus_y_pos)._replace(z=target_z),
        Point(*hcapi.config.calibration.edge_sense.plus_y_pos)._replace(z=target_z),
        OT3Axis.Y,
    )
    return x_center, y_center


async def calibrate_mount(
    hcapi: OT3API,
    mount: OT3Mount,
    method: CalibrationMethod = CalibrationMethod.BINARY_SEARCH,
) -> Point:
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

    if method == CalibrationMethod.BINARY_SEARCH:
        x_center, y_center = await find_slot_center_binary(hcapi, mount, z_pos)
    elif method == CalibrationMethod.NONCONTACT_PASS:
        x_center, y_center = await find_slot_center_noncontact(hcapi, mount, z_pos)
    else:
        raise RuntimeError("Unknown calibration method")

    # The center of the calibration slot is the xy-center in-plane, and
    # the absolute sense value out-of-plane
    center = Point(x_center, y_center, z_pos)
    LOG.info(f"Found calibration value {center} for mount {mount.name}")
    return center
