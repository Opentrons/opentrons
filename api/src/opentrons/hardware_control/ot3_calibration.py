"""Functions and utilites for OT3 calibration."""
from __future__ import annotations
from dataclasses import dataclass
from typing_extensions import Final, Literal, TYPE_CHECKING
from typing import Union, Tuple, List, Dict, Any, Optional
import datetime
import numpy as np
from enum import Enum
from math import floor, copysign
from logging import getLogger

from .types import OT3Mount, OT3Axis, GripperProbe
from opentrons.types import Point
from opentrons.config.types import CapacitivePassSettings, EdgeSenseSettings
import json

from opentrons_shared_data.deck import load as load_deck

if TYPE_CHECKING:
    from .ot3api import OT3API

LOG = getLogger(__name__)

CAL_TRANSIT_HEIGHT: Final[float] = 10
LINEAR_TRANSIT_HEIGHT: Final[float] = 1
SEARCH_TRANSIT_HEIGHT: Final[float] = 5
GRIPPER_GRIP_FORCE: Final[float] = 20

# FIXME: add these to shared-data
Z_PREP_OFFSET = Point(x=13, y=13, z=0)
CALIBRATION_MIN_VALID_STRIDE: Final[float] = 0.1
CALIBRATION_PROBE_DIAMETER: Final[float] = 4
CALIBRATION_SQUARE_DEPTH: Final[float] = -0.25
CALIBRATION_SQUARE_SIZE: Final[float] = 20
EDGES = {
    "left": Point(x=-CALIBRATION_SQUARE_SIZE * 0.5),
    "right": Point(x=CALIBRATION_SQUARE_SIZE * 0.5),
    "top": Point(y=CALIBRATION_SQUARE_SIZE * 0.5),
    "bottom": Point(y=-CALIBRATION_SQUARE_SIZE * 0.5),
}
NON_REPEATABLE_STRIDES: List[float] = [0.0, 3.0]
REPEATABLE_STRIDES: List[float] = [1.0, 0.25, 0.1, 0.025]


@dataclass
class DeckHeightValidRange:
    min: float
    max: float

    @classmethod
    def build(
        cls, nominal_z: float, edge_settings: EdgeSenseSettings
    ) -> "DeckHeightValidRange":
        return cls(
            min=nominal_z - edge_settings.overrun_tolerance_mm,
            max=nominal_z + edge_settings.early_sense_tolerance_mm,
        )


class CalibrationMethod(Enum):
    LINEAR_SEARCH = "linear search"
    BINARY_SEARCH = "binary search"
    NONCONTACT_PASS = "noncontact pass"


class DeckNotFoundError(RuntimeError):
    def __init__(self, deck_height: float, lower_limit: float) -> None:
        super().__init__(
            f"Deck height at z={deck_height}mm beyond lower limit: {lower_limit}."
        )


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


# TODO: we should further investigate and compare the results of the two
# calibration methods: linear vs binary. We currently will be using the linear
# search as the default as it has been thoroughly tested by the testing team

# BINARY SEARCH METHODS


async def find_edge_binary(
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
    edge_settings = hcapi.config.calibration.edge_sense_binary
    # Our first search position is at the nominal offset by our stride
    # against the search direction. That way we always start on the deck
    stride = edge_settings.search_initial_tolerance_mm * search_direction
    checking_pos = slot_edge_nominal + search_axis.set_in_point(Point(0, 0, 0), -stride)

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
        checking_pos += search_axis.set_in_point(Point(0, 0, 0), stride)

    LOG.debug(
        f"Found edge {search_axis} direction {search_direction} at {checking_pos}"
    )
    return search_axis.of_point(checking_pos)


async def find_slot_center_binary(
    hcapi: OT3API, mount: OT3Mount, estimated_center: Point
) -> Point:
    """Find the center of the calibration slot by binary-searching its edges.
    Returns the XY-center of the slot.
    """
    # Find all four edges of the calibration slot
    plus_x_edge = await find_edge_binary(
        hcapi,
        mount,
        estimated_center + EDGES["right"],
        OT3Axis.X,
        -1,
    )
    LOG.info(f"Found +x edge at {plus_x_edge}mm")
    minus_x_edge = await find_edge_binary(
        hcapi,
        mount,
        estimated_center + EDGES["left"],
        OT3Axis.X,
        1,
    )
    LOG.info(f"Found -x edge at {minus_x_edge}mm")
    plus_y_edge = await find_edge_binary(
        hcapi,
        mount,
        estimated_center + EDGES["top"],
        OT3Axis.Y,
        -1,
    )
    LOG.info(f"Found +y edge at {plus_y_edge}mm")
    minus_y_edge = await find_edge_binary(
        hcapi,
        mount,
        estimated_center + EDGES["bottom"],
        OT3Axis.Y,
        1,
    )
    LOG.info(f"Found -y edge at {minus_y_edge}mm")
    return Point(
        x=(plus_x_edge + minus_x_edge) / 2,
        y=(plus_y_edge + minus_y_edge) / 2,
        z=estimated_center.z,
    )


# LINEAR SEARCH METHODS

# FIXME: this should live in shared-data deck definition
def _get_calibration_square_position_in_slot(slot: int) -> Point:
    """Get slot top-left position."""
    deck = load_deck("ot3_standard", version=3)
    slots = deck["locations"]["orderedSlots"]
    s = slots[slot - 1]
    assert s["id"] == str(slot)
    bottom_left = Point(*s["position"])
    slot_size_x = s["boundingBox"]["xDimension"]
    slot_size_y = s["boundingBox"]["yDimension"]
    relative_center = Point(x=float(slot_size_x), y=float(slot_size_y)) * 0.5
    return bottom_left + relative_center + Point(z=CALIBRATION_SQUARE_DEPTH)


async def find_deck_height(
    hcapi: OT3API, mount: OT3Mount, nominal_center: Point
) -> float:
    """
    Find the height of the deck in this mount's frame of reference.

    The deck nominal height in deck coordinates is 0 (that's part of the
    definition of deck coordinates) but if we have not yet calibrated a
    particular tool on a particular mount, then the z deck coordinate that
    will cause a collision is not 0. This routine finds that value.
    """
    z_pass_settings = hcapi.config.calibration.z_offset.pass_settings
    z_prep_point = nominal_center + Z_PREP_OFFSET
    deck_z = await _probe_deck_at(hcapi, mount, z_prep_point, z_pass_settings)
    z_limit = nominal_center.z - z_pass_settings.max_overrun_distance_mm
    if deck_z < z_limit:
        raise DeckNotFoundError(deck_z, z_limit)
    LOG.info(f"autocalibration: found deck at {deck_z}")
    return deck_z


def edge_offset_from_probe(
    search_axis: OT3Axis,
    search_direction: Literal[1, -1],
    probe_pos: Point,
) -> Point:
    """Find the position of the edge from the center point of a probe.

    The edge position can be found by offseting the center point with the
    radius of the probe in the search direction.
    """
    offset_from_center = np.copysign(CALIBRATION_PROBE_DIAMETER * 0.5, search_direction)
    return search_axis.set_in_point(
        probe_pos, search_axis.of_point(probe_pos) + offset_from_center
    )


async def _probe_deck_at(
    api: OT3API, mount: OT3Mount, target: Point, settings: CapacitivePassSettings
) -> float:
    here = await api.gantry_position(mount)
    abs_transit_height = max(
        target.z + LINEAR_TRANSIT_HEIGHT, target.z + settings.prep_distance_mm
    )
    safe_height = max(here.z, target.z, abs_transit_height)
    await api.move_to(mount, here._replace(z=safe_height))
    await api.move_to(mount, target._replace(z=safe_height))
    await api.move_to(mount, target._replace(z=abs_transit_height))
    _found_pos = await api.capacitive_probe(
        mount, OT3Axis.by_mount(mount), target.z, settings
    )
    # don't use found Z position to calculate an updated transit height
    # because the probe may have gone through the hole
    await api.move_to(mount, target._replace(z=abs_transit_height))
    return _found_pos


async def _take_stride(
    hcapi: OT3API,
    mount: OT3Mount,
    search_axis: OT3Axis,
    probe_pos: Point,
    stride_size: float,
    max_stride_distance: float,
    valid_z_range: DeckHeightValidRange,
    in_search_direction: bool,
    repeat_if_failed: bool,
) -> Tuple[Point, Literal[1, -1], bool]:
    """
    Detect the presence of an edge by moving a probe along the search axis.

    Returns
    -------
    1. The last target position of the stride sequence.
    2. Whether or not we find the presence of the edge. If so, the last target position
       is where the edge is.
    3. The direction of the next stride sequence.
    """
    LOG.info(f"Probing at {probe_pos} with stride at {stride_size}mm")
    edge_sense = hcapi.config.calibration.edge_sense
    traveled = 0.0
    stride_vector = search_axis.set_in_point(Point(0, 0, 0), stride_size)
    target = probe_pos

    goal_reached = False
    while traveled < abs(max_stride_distance) or not repeat_if_failed:
        target += stride_vector
        found_height = await _probe_deck_at(
            hcapi, mount, target, edge_sense.pass_settings
        )
        traveled += abs(stride_size)
        # Something is wrong when we found deck too soon, end it now
        if found_height > valid_z_range.max:
            raise EarlyCapacitiveSenseTrigger(found_height, target.z)
        # check against reasonble minimum height of the deck to see if we have made contact
        touched_deck = found_height >= valid_z_range.min
        if touched_deck:
            LOG.info(f"Deck found; new deck height: {found_height}mm")
            # Use the most updated deck height for the next movement
            target = target._replace(z=found_height)
        else:
            LOG.info("Deck missed")
        # If we're in our search direction, the goal is to find the deck.
        # Or if we're against the search direction, we want to miss the deck.
        goal_reached = touched_deck if in_search_direction else not touched_deck
        LOG.info(
            f"Goal reached for {stride_size} mm: {goal_reached}, stride_vector: {stride_vector}"
        )
        if goal_reached or not repeat_if_failed:
            # reverse direction if reached goal
            return (
                target,
                np.sign(
                    (stride_size if stride_size != 0.0 else 1)
                    * (-1 if goal_reached else 1)
                ),
                goal_reached,
            )
    # did not reach out goal before we ran out of strides, we should continue
    # going the same direction in the next stride size
    LOG.info(f"Ran out of {stride_size} stride")
    return target, np.sign(stride_size), False


async def find_edge_linear(
    hcapi: OT3API,
    mount: OT3Mount,
    slot_edge_nominal: Point,
    search_axis: Union[Literal[OT3Axis.X, OT3Axis.Y]],
    search_direction: Literal[1, -1],
) -> Point:
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
    edge_settings = hcapi.config.calibration.edge_sense
    abs_position: Optional[Point] = None

    # Every probe event has a Z-axis window where detections are considered valid
    valid_z_range = DeckHeightValidRange.build(slot_edge_nominal.z, edge_settings)
    next_target = slot_edge_nominal
    next_dir = search_direction
    for s in NON_REPEATABLE_STRIDES:
        stride = np.copysign(s, next_dir)
        in_search_direction = search_direction == next_dir
        next_target, next_dir, _ = await _take_stride(
            hcapi,
            mount,
            search_axis,
            next_target,
            stride,
            abs(stride),  # not repeatable, max stride should be same as stride size
            valid_z_range,
            in_search_direction,
            False,
        )

    for s in REPEATABLE_STRIDES:
        stride = np.copysign(s, next_dir)
        in_search_direction = search_direction == next_dir
        next_target, next_dir, goal_reached = await _take_stride(
            hcapi,
            mount,
            search_axis,
            next_target,
            stride,
            abs(s * edge_settings.search_iteration_limit),
            valid_z_range,
            in_search_direction,
            True,
        )
        if goal_reached and s <= CALIBRATION_MIN_VALID_STRIDE:
            LOG.info(f"Edge found at {next_target}, stride size: {s} in {search_axis}")
            abs_position = edge_offset_from_probe(
                search_axis, search_direction, next_target
            )

    if not abs_position:
        raise RuntimeError(
            f"Unable to find edge for {search_direction} {search_axis} direction."
        )
    return abs_position


async def find_slot_center_linear(
    hcapi: OT3API, mount: OT3Mount, estimated_center: Point
) -> Point:
    """Find the center of the calibration slot by binary-searching its edges.

    Params
    ------
    hcapi: The api instance to run commands through
    mount: The mount to calibrate
    estimated_center: The XY-center of a slot based on deck definition with the estimated Z height obtained from `find_deck_height()`

    Returns
    -------
    The XYZ-center of the slot, where the z-value is obtained by averaging the
    z's of the four found edges.
    """
    # Find +X (right) edge
    plus_x_edge = await find_edge_linear(
        hcapi, mount, estimated_center + EDGES["right"], OT3Axis.X, 1
    )
    LOG.info(f"Found +x edge at {plus_x_edge}mm")
    estimated_center = estimated_center._replace(x=plus_x_edge.x - EDGES["right"].x)

    # Find -X (left) edge
    minus_x_edge = await find_edge_linear(
        hcapi, mount, estimated_center + EDGES["left"], OT3Axis.X, -1
    )
    LOG.info(f"Found -x edge at {minus_x_edge}mm")
    estimated_center = estimated_center._replace(x=(plus_x_edge.x + minus_x_edge.x) / 2)

    # Find +Y (top) edge
    plus_y_edge = await find_edge_linear(
        hcapi, mount, estimated_center + EDGES["top"], OT3Axis.Y, 1
    )
    LOG.info(f"Found +y edge at {plus_y_edge}mm")
    estimated_center = estimated_center._replace(y=plus_y_edge.y - EDGES["top"].y)

    # Find -Y (bottom) edge
    minus_y_edge = await find_edge_linear(
        hcapi, mount, estimated_center + EDGES["bottom"], OT3Axis.Y, -1
    )
    LOG.info(f"Found -y edge at {minus_y_edge}mm")
    estimated_center = estimated_center._replace(y=(plus_y_edge.y + minus_y_edge.y) / 2)

    # Found XY center and the average of the edges' Zs
    return estimated_center._replace(
        z=(plus_x_edge.z + minus_x_edge.z + plus_y_edge.z + minus_y_edge.z) / 4,
    )


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
    await hcapi.move_to(mount, here._replace(z=SEARCH_TRANSIT_HEIGHT))
    edge_settings = hcapi.config.calibration.edge_sense

    start = axis.set_in_point(
        minus_edge_nominal,
        axis.of_point(minus_edge_nominal) - edge_settings.search_initial_tolerance_mm,
    )
    end = axis.set_in_point(
        plus_edge_nominal,
        axis.of_point(plus_edge_nominal) + edge_settings.search_initial_tolerance_mm,
    )

    await hcapi.move_to(mount, start._replace(z=SEARCH_TRANSIT_HEIGHT))

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
    hcapi: OT3API, mount: OT3Mount, estimated_center: Point
) -> Point:
    NONCONTACT_INTERVAL_MM: float = 0.1
    travel_center = estimated_center + Point(0, 0, NONCONTACT_INTERVAL_MM)
    x_center = await find_axis_center(
        hcapi,
        mount,
        travel_center + EDGES["left"],
        travel_center + EDGES["right"],
        OT3Axis.X,
    )
    y_center = await find_axis_center(
        hcapi,
        mount,
        travel_center + EDGES["bottom"],
        travel_center + EDGES["top"],
        OT3Axis.Y,
    )
    return Point(x_center, y_center, estimated_center.z)


async def _calibrate_mount(
    hcapi: OT3API,
    mount: OT3Mount,
    slot: int = 5,
    method: CalibrationMethod = CalibrationMethod.LINEAR_SEARCH,
) -> Point:
    """
    Run automatic calibration for the tool attached to the specified mount.

    Before running this function, make sure that the appropriate probe
    has been attached or prepped on the tool (for instance, a capacitive
    tip has been attached, or the conductive probe has been attached,
    or the probe has been lowered). The robot should be homed.

    Note: To calibrate a gripper, this process must be performed on the front
    and rear calibration pins separately. The gripper calibration offset is
    the average of the pin offsets, which can be obtained by passing the
    two offsets into the `gripper_pin_offsets_mean` func.

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
    nominal_center = _get_calibration_square_position_in_slot(slot)
    try:
        # First, find the estimated deck height. This will be used to baseline the edge detection points.
        z_height = await find_deck_height(hcapi, mount, nominal_center)
        LOG.info(f"Found deck at {z_height}mm")

        # Perform xy offset search
        if method == CalibrationMethod.LINEAR_SEARCH:
            found_center = await find_slot_center_linear(
                hcapi, mount, nominal_center._replace(z=z_height)
            )
        elif method == CalibrationMethod.BINARY_SEARCH:
            found_center = await find_slot_center_binary(
                hcapi, mount, nominal_center._replace(z=z_height)
            )
        elif method == CalibrationMethod.NONCONTACT_PASS:
            # FIXME: use slot to find ideal position
            found_center = await find_slot_center_noncontact(
                hcapi, mount, nominal_center._replace(z=z_height)
            )
        else:
            raise RuntimeError("Unknown calibration method")

        offset = nominal_center - found_center
        # update center with values obtained during calibration
        LOG.info(f"Found calibration value {offset} for mount {mount.name}")
        return offset

    except (InaccurateNonContactSweepError, EarlyCapacitiveSenseTrigger):
        LOG.info(
            "Error occurred during calibration. Resetting to current saved calibration value."
        )
        await hcapi.reset_instrument_offset(mount, to_default=False)
        # re-raise exception after resetting instrument offset
        raise


def gripper_pin_offsets_mean(front: Point, rear: Point) -> Point:
    """
    Get calibration offset of a gripper from its front and rear pin offsets.

    This function should be used for gripper calibration only.

    Params
    ------
    front: gripper's front pin calibration offset
    rear: gripper's rear pin calibration offset

    Returns
    -------
    The gripper calibration offset.
    """
    return 0.5 * (front + rear)


async def calibrate_gripper_jaw(
    hcapi: OT3API,
    probe: GripperProbe,
    slot: int = 5,
    method: CalibrationMethod = CalibrationMethod.LINEAR_SEARCH,
) -> Point:
    """
    Run automatic calibration for gripper jaw.

    Before running this function, make sure that the appropriate probe
    has been attached or prepped on the tool (for instance, a capacitive
    tip has been attached, or the conductive probe has been attached,
    or the probe has been lowered). The robot should be homed.

    This process must be performed on the front
    and rear calibration pins separately. The gripper calibration offset is
    the average of the pin offsets, which can be obtained by passing the
    two offsets into the `gripper_pin_offsets_mean` func.
    """
    try:
        await hcapi.reset_instrument_offset(OT3Mount.GRIPPER)
        hcapi.add_gripper_probe(probe)
        await hcapi.grip(GRIPPER_GRIP_FORCE)
        offset = await _calibrate_mount(hcapi, OT3Mount.GRIPPER, slot, method)
        LOG.info(f"Gripper {probe.name} probe offset: {offset}")
        return offset
    finally:
        hcapi.remove_gripper_probe()
        await hcapi.ungrip()


async def calibrate_gripper(
    hcapi: OT3API, offset_front: Point, offset_rear: Point
) -> Point:
    """Calibrate gripper."""
    offset = gripper_pin_offsets_mean(front=offset_front, rear=offset_rear)
    LOG.info(f"Gripper calibration offset: {offset}")
    await hcapi.save_instrument_offset(OT3Mount.GRIPPER, offset)
    return offset


async def calibrate_pipette(
    hcapi: OT3API,
    mount: Literal[OT3Mount.LEFT, OT3Mount.RIGHT],
    slot: int = 5,
    method: CalibrationMethod = CalibrationMethod.LINEAR_SEARCH,
) -> Point:
    """
    Run automatic calibration for pipette.

    Before running this function, make sure that the appropriate probe
    has been attached or prepped on the tool (for instance, a capacitive
    tip has been attached, or the conductive probe has been attached,
    or the probe has been lowered). The robot should be homed.
    """
    try:
        await hcapi.reset_instrument_offset(mount)
        await hcapi.add_tip(mount, hcapi.config.calibration.probe_length)
        offset = await _calibrate_mount(hcapi, mount, slot, method)
        await hcapi.save_instrument_offset(mount, offset)
        return offset
    finally:
        await hcapi.remove_tip(mount)
