"""Functions and utilites for OT3 calibration."""
from __future__ import annotations
from typing_extensions import Final, Literal, TYPE_CHECKING
from typing import Union, Tuple, List, Dict, Any, Optional
import datetime
import numpy as np
from enum import Enum
from math import floor, copysign
from logging import getLogger
from opentrons.util.linal import solve_attitude

from .types import OT3Mount, OT3Axis, GripperProbe
from opentrons.types import Point
from opentrons.config.types import CapacitivePassSettings
import json

from opentrons_shared_data.deck import load as load_deck
from opentrons.calibration_storage.types import AttitudeMatrix

if TYPE_CHECKING:
    from .ot3api import OT3API

LOG = getLogger(__name__)

CAL_TRANSIT_HEIGHT: Final[float] = 5
LINEAR_TRANSIT_HEIGHT: Final[float] = 1
SEARCH_TRANSIT_HEIGHT: Final[float] = 5
GRIPPER_GRIP_FORCE: Final[float] = 20
BELT_CAL_TRANSIT_HEIGHT: Final[float] = 50

# FIXME: add these to shared-data
Z_PREP_OFFSET = Point(x=13, y=13, z=0)
CALIBRATION_SQUARE_DEPTH: Final[float] = -0.25
CALIBRATION_SQUARE_SIZE: Final[float] = 20
CALIBRATION_PROBE_RADIUS: Final[float] = 2
# edges are offset by the radius of the probe to get the edge-to-edge position
EDGES = {
    "left": Point(x=-CALIBRATION_SQUARE_SIZE * 0.5 + CALIBRATION_PROBE_RADIUS),
    "right": Point(x=CALIBRATION_SQUARE_SIZE * 0.5 - CALIBRATION_PROBE_RADIUS),
    "top": Point(y=CALIBRATION_SQUARE_SIZE * 0.5 - CALIBRATION_PROBE_RADIUS),
    "bottom": Point(y=-CALIBRATION_SQUARE_SIZE * 0.5 + CALIBRATION_PROBE_RADIUS),
}


class CalibrationMethod(Enum):
    BINARY_SEARCH = "binary search"
    NONCONTACT_PASS = "noncontact pass"


class CalibrationStructureNotFoundError(RuntimeError):
    def __init__(self, structure_height: float, lower_limit: float) -> None:
        super().__init__(
            f"Structure height at z={structure_height}mm beyond lower limit: {lower_limit}."
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


async def find_edge_binary(
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
    here = await hcapi.gantry_position(mount)
    await hcapi.move_to(mount, here._replace(z=CAL_TRANSIT_HEIGHT))
    edge_settings = hcapi.config.calibration.edge_sense
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
            checking_pos.z,
            edge_settings.pass_settings,
        )
        await hcapi.move_to(mount, check_prep)
        if interaction_pos > checking_pos.z + edge_settings.early_sense_tolerance_mm:
            await hcapi.home_z()
            raise EarlyCapacitiveSenseTrigger(interaction_pos, slot_edge_nominal.z)
        if interaction_pos < (checking_pos.z - edge_settings.overrun_tolerance_mm):
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
            # update the fonud deck value
            checking_pos = checking_pos._replace(z=interaction_pos)
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
    return checking_pos


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
    LOG.info(f"Found +x edge at {plus_x_edge.x}mm")
    estimated_center = estimated_center._replace(x=plus_x_edge.x - EDGES["right"].x)

    minus_x_edge = await find_edge_binary(
        hcapi,
        mount,
        estimated_center + EDGES["left"],
        OT3Axis.X,
        1,
    )
    LOG.info(f"Found -x edge at {minus_x_edge.x}mm")
    estimated_center = estimated_center._replace(x=(plus_x_edge.x + minus_x_edge.x) / 2)

    plus_y_edge = await find_edge_binary(
        hcapi,
        mount,
        estimated_center + EDGES["top"],
        OT3Axis.Y,
        -1,
    )
    LOG.info(f"Found +y edge at {plus_y_edge.y}mm")
    estimated_center = estimated_center._replace(y=plus_y_edge.y - EDGES["top"].y)

    minus_y_edge = await find_edge_binary(
        hcapi,
        mount,
        estimated_center + EDGES["bottom"],
        OT3Axis.Y,
        1,
    )
    LOG.info(f"Found -y edge at {minus_y_edge.y}mm")
    estimated_center = estimated_center._replace(y=(plus_y_edge.y + minus_y_edge.y) / 2)

    # Found XY center and the average of the edges' Zs
    return estimated_center._replace(
        z=(plus_x_edge.z + minus_x_edge.z + plus_y_edge.z + minus_y_edge.z) / 4,
    )


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


async def find_calibration_structure_height(
    hcapi: OT3API, mount: OT3Mount, nominal_center: Point
) -> float:
    """
    Find the height of the calibration structure in this mount's frame of reference.

    This could be the deck height or the module calibration adapter height.

    The deck nominal height in deck coordinates is 0 (that's part of the
    definition of deck coordinates) but if we have not yet calibrated a
    particular tool on a particular mount, then the z deck coordinate that
    will cause a collision is not 0. This routine finds that value.
    """
    z_pass_settings = hcapi.config.calibration.z_offset.pass_settings
    z_prep_point = nominal_center + Z_PREP_OFFSET
    structure_z = await _probe_deck_at(hcapi, mount, z_prep_point, z_pass_settings)
    z_limit = nominal_center.z - z_pass_settings.max_overrun_distance_mm
    if structure_z < z_limit:
        raise CalibrationStructureNotFoundError(structure_z, z_limit)
    LOG.info(f"autocalibration: found structure at {structure_z}")
    return structure_z


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


async def find_calibration_structure_center(
    hcapi: OT3API,
    mount: OT3Mount,
    nominal_center: Point,
    method: CalibrationMethod = CalibrationMethod.BINARY_SEARCH,
) -> Point:

    # Perform xy offset search
    if method == CalibrationMethod.BINARY_SEARCH:
        found_center = await find_slot_center_binary(hcapi, mount, nominal_center)
    elif method == CalibrationMethod.NONCONTACT_PASS:
        # FIXME: use slot to find ideal position
        found_center = await find_slot_center_noncontact(hcapi, mount, nominal_center)
    else:
        raise RuntimeError("Unknown calibration method")
    return found_center


async def _calibrate_mount(
    hcapi: OT3API,
    mount: OT3Mount,
    slot: int = 5,
    method: CalibrationMethod = CalibrationMethod.BINARY_SEARCH,
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
        # find the center of the calibration sqaure
        offset = await find_calibration_structure_position(
            hcapi, mount, nominal_center, method
        )
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


async def find_calibration_structure_position(
    hcapi: OT3API,
    mount: OT3Mount,
    nominal_center: Point,
    method: CalibrationMethod = CalibrationMethod.BINARY_SEARCH,
) -> Point:
    """Find the calibration square offset given an arbitry postition on the deck."""
    # Find the estimated structure plate height. This will be used to baseline the edge detection points.
    z_height = await find_calibration_structure_height(hcapi, mount, nominal_center)
    initial_center = nominal_center._replace(z=z_height)
    LOG.info(f"Found structure plate at {z_height}mm")

    # Find the calibration square center using the given method
    found_center = await find_calibration_structure_center(
        hcapi, mount, initial_center, method
    )
    return nominal_center - found_center


async def _calibrate_module(
    hcapi: OT3API,
    mount: OT3Mount,
    slot: int,
    method: CalibrationMethod = CalibrationMethod.BINARY_SEARCH,
) -> Point:
    """This will find the position of the calibration square for a given module."""
    # Find the module calibration offsets
    # TODO (ba, 2023-03-14): the nominal_center will be passed in from protocol engine in the future,
    # where it would have the module + module calibration geometric offsets applied.
    nominal_center = _get_calibration_square_position_in_slot(slot)
    offset = await find_calibration_structure_position(
        hcapi, mount, nominal_center, method
    )
    return offset


async def find_slot_center_binary_from_nominal_center(
    hcapi: OT3API,
    mount: OT3Mount,
    slot: int,
) -> Tuple[Point, Point]:
    """
    For use with calibrate_belts. For specified slot, finds actual slot center via binary search and nominal slot center

    Params
    ------
    hcapi: a hardware control api to run commands against
    mount: the mount to calibration
    slot: a specific deck slot

    Returns
    -------
    The actual and nominal centers of the specified slot.
    """
    nominal_center = _get_calibration_square_position_in_slot(slot)
    offset = await find_calibration_structure_position(
        hcapi, mount, nominal_center, method=CalibrationMethod.BINARY_SEARCH
    )
    return offset, nominal_center


async def _determine_transform_matrix(
    hcapi: OT3API,
    mount: OT3Mount,
) -> AttitudeMatrix:
    """
    Run automatic calibration for the gantry x and y belts attached to the specified mount. Returned linear transform matrix is determined via the
    actual and nominal center points of the back right (A), front right (B), and back left (C) slots.

    Params
    ------
    hcapi: a hardware control api to run commands against
    mount: the mount to calibration

    Returns
    -------
    A listed matrix of the linear transform in the x and y dimensions that accounts for the stretch of the gantry x and y belts.
    """
    slot_a, slot_b, slot_c = 12, 3, 10
    point_a, nominal_point_a = await find_slot_center_binary_from_nominal_center(
        hcapi, mount, slot_a
    )
    await hcapi.move_rel(mount, Point(0, 0, BELT_CAL_TRANSIT_HEIGHT))
    point_b, nominal_point_b = await find_slot_center_binary_from_nominal_center(
        hcapi, mount, slot_b
    )
    await hcapi.move_rel(mount, Point(0, 0, BELT_CAL_TRANSIT_HEIGHT))
    point_c, nominal_point_c = await find_slot_center_binary_from_nominal_center(
        hcapi, mount, slot_c
    )
    expected = (
        (nominal_point_a.x, nominal_point_a.y, nominal_point_a.z),
        (nominal_point_b.x, nominal_point_b.y, nominal_point_b.z),
        (nominal_point_c.x, nominal_point_c.y, nominal_point_c.z),
    )
    actual = (
        (point_a.x, point_a.y, point_a.z),
        (point_b.x, point_b.y, point_b.z),
        (point_c.x, point_c.y, point_c.z),
    )
    return solve_attitude(expected, actual)


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
    method: CalibrationMethod = CalibrationMethod.BINARY_SEARCH,
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
    method: CalibrationMethod = CalibrationMethod.BINARY_SEARCH,
) -> Point:
    """
    Run automatic calibration for pipette.

    Before running this function, make sure that the appropriate probe
    has been attached or prepped on the tool (for instance, a capacitive
    tip has been attached, or the conductive probe has been attached,
    or the probe has been lowered).
    """
    try:
        await hcapi.reset_instrument_offset(mount)
        await hcapi.add_tip(mount, hcapi.config.calibration.probe_length)
        offset = await _calibrate_mount(hcapi, mount, slot, method)
        await hcapi.save_instrument_offset(mount, offset)
        return offset
    finally:
        await hcapi.remove_tip(mount)


async def calibrate_module(
    hcapi: OT3API,
    mount: OT3Mount,
    slot: int,
    module_id: str,
) -> Point:
    """
    Run automatic calibration for a module.

    Before running this function, make sure that the appropriate probe
    has been attached or prepped on the tool (for instance, a capacitive
    tip has been attached, or the conductive probe has been attached,
    or the probe has been lowered). We also need to have the module
    prepped for calibration (for example, not heating, lid closed,
    not shaking, etc) and the corresponding module calibration
    block placed in the module slot.

    The robot should be homed before calling this function.
    """

    try:
        # add the probe depending on the mount
        if mount == OT3Mount.GRIPPER:
            hcapi.add_gripper_probe(GripperProbe.FRONT)
        else:
            await hcapi.add_tip(mount, hcapi.config.calibration.probe_length)

        # find the offset
        offset = await _calibrate_module(hcapi, mount, slot)
        await hcapi.save_module_offset(module_id, mount, slot, offset)
        return offset
    finally:
        # remove probe
        if mount == OT3Mount.GRIPPER:
            hcapi.remove_gripper_probe()
            await hcapi.ungrip()
        else:
            await hcapi.remove_tip(mount)


async def calibrate_belts(
    hcapi: OT3API,
    mount: OT3Mount,
) -> AttitudeMatrix:
    """
    Run automatic calibration for the gantry x and y belts attached to the specified mount.

    Params
    ------
    hcapi: a hardware control api to run commands against
    mount: the mount to calibration

    Returns
    -------
    A listed matrix of the linear transform in the x and y dimensions that accounts for the stretch of the gantry x and y belts.
    """
    if mount == OT3Mount.GRIPPER:
        raise RuntimeError("Must use pipette mount, not gripper")
    try:
        await hcapi.add_tip(mount, hcapi.config.calibration.probe_length)
        return await _determine_transform_matrix(hcapi, mount)
    finally:
        await hcapi.remove_tip(mount)
