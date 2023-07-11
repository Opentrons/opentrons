"""Functions and utilites for OT3 calibration."""
from __future__ import annotations
from functools import lru_cache
from dataclasses import dataclass
from typing_extensions import Final, Literal, TYPE_CHECKING
from typing import Tuple, List, Dict, Any, Optional, Union
import datetime
import numpy as np
from enum import Enum
from math import floor, copysign, isclose
from logging import getLogger
from opentrons.util.linal import solve_attitude

from .types import OT3Mount, OT3Axis, GripperProbe
from opentrons.types import Point
from opentrons.config.types import CapacitivePassSettings, EdgeSenseSettings, OT3Config
import json

from opentrons_shared_data.deck import (
    get_calibration_square_position_in_slot,
    Z_PREP_OFFSET,
    CALIBRATION_PROBE_RADIUS,
    CALIBRATION_SQUARE_EDGES as SQUARE_EDGES,
)
from .robot_calibration import (
    RobotCalibration,
    DeckCalibration,
)
from opentrons.calibration_storage import types
from opentrons.calibration_storage.ot3.deck_attitude import (
    save_robot_belt_attitude,
    get_robot_belt_attitude,
    delete_robot_belt_attitude,
)
from opentrons.config.robot_configs import (
    default_ot3_deck_calibration,
    defaults_ot3,
)
from .util import DeckTransformState

if TYPE_CHECKING:
    from .ot3api import OT3API

LOG = getLogger(__name__)

CAL_TRANSIT_HEIGHT: Final[float] = 5
LINEAR_TRANSIT_HEIGHT: Final[float] = 1
SEARCH_TRANSIT_HEIGHT: Final[float] = 5
GRIPPER_GRIP_FORCE: Final[float] = 20
BELT_CAL_TRANSIT_HEIGHT: Final[float] = 50

PREP_OFFSET_DEPTH = Point(*Z_PREP_OFFSET)
EDGES = {
    "left": Point(*SQUARE_EDGES["left"]),
    "right": Point(*SQUARE_EDGES["right"]),
    "top": Point(*SQUARE_EDGES["top"]),
    "bottom": Point(*SQUARE_EDGES["bottom"]),
}


class CalibrationMethod(Enum):
    BINARY_SEARCH = "binary search"
    NONCONTACT_PASS = "noncontact pass"


class CalibrationTarget(Enum):
    DECK_OBJECT = "deck_object"
    GANTRY_INSTRUMENT = "gantry_instrument"


class CalibrationStructureNotFoundError(RuntimeError):
    def __init__(self, structure_height: float, lower_limit: float) -> None:
        super().__init__(
            f"Structure height at z={structure_height}mm beyond lower limit: {lower_limit}."
        )


class EdgeNotFoundError(RuntimeError):
    pass


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


def _deck_hit(
    found_pos: float, expected_pos: float, settings: EdgeSenseSettings
) -> bool:
    """
    Evaluate the height found by capacitive probe against search settings
    to determine whether or not it had hit the deck.
    """
    if found_pos > expected_pos + settings.early_sense_tolerance_mm:
        raise EarlyCapacitiveSenseTrigger(found_pos, expected_pos)
    return (
        True if found_pos >= (expected_pos - settings.overrun_tolerance_mm) else False
    )


async def _verify_edge_pos(
    hcapi: OT3API,
    mount: OT3Mount,
    search_axis: Union[Literal[OT3Axis.X, OT3Axis.Y]],
    found_edge: Point,
    last_stride: float,
    search_direction: Literal[1, -1],
) -> None:
    """
    Probe both sides of the found edge in the search axis and compare the results.
    If the position found is valid, we should see that the probe hit the deck on
    one side and miss on the other. If the results are not opposite of each other,
    we didn't find the edge properly.
    """
    edge_settings = hcapi.config.calibration.edge_sense
    # twice the last stride size
    check_stride = last_stride * 2
    last_result = None
    edge_name_str = f"{'+' if search_direction == -1 else '-'}{search_axis}"
    for dir in [-1, 1]:
        checking_pos = found_edge + search_axis.set_in_point(
            Point(0, 0, 0), check_stride * dir
        )
        LOG.info(
            f"Checking {edge_name_str} in {dir} direction at {checking_pos}, stride_size: {check_stride}"
        )
        height = await _probe_deck_at(
            hcapi, mount, checking_pos, edge_settings.pass_settings
        )
        hit_deck = _deck_hit(height, found_edge.z, edge_settings)
        LOG.info(f"Deck {'hit' if hit_deck else 'miss'} at check pos: {checking_pos}")
        if last_result is not None and hit_deck != last_result:
            LOG.info(
                f"Edge {edge_name_str} verified successfully at {check_stride} mm resolution."
            )
            return
        else:
            last_result = hit_deck
    raise EdgeNotFoundError(
        f"Edge {edge_name_str} could not be verified at {check_stride} mm resolution."
    )


def critical_edge_offset(
    search_axis: Union[Literal[OT3Axis.X, OT3Axis.Y]], direction_if_hit: Literal[1, -1]
) -> Point:
    """
    Offset to be applied when we are aligning the edge of the probe to the edge of the
    calibration square.
    """
    return search_axis.set_in_point(
        Point(0, 0, 0), direction_if_hit * CALIBRATION_PROBE_RADIUS
    )


async def find_edge_binary(
    hcapi: OT3API,
    mount: OT3Mount,
    slot_edge_nominal: Point,
    search_axis: Union[Literal[OT3Axis.X, OT3Axis.Y]],
    direction_if_hit: Literal[1, -1],
    raise_verify_error: bool = True,
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
    direction_if_hit: The direction to search next if the probe hits the deck.
    Returns
    -------
    The absolute position at which the center of the effector is inside the slot
    and its edge is aligned with the calibration slot edge.
    """
    edge_settings = hcapi.config.calibration.edge_sense
    # Our first search position is at the slot edge nominal at the probe's edge
    checking_pos = slot_edge_nominal + critical_edge_offset(
        search_axis, direction_if_hit
    )
    stride = edge_settings.search_initial_tolerance_mm * direction_if_hit
    final_z_height_found = slot_edge_nominal.z
    for _ in range(edge_settings.search_iteration_limit):
        LOG.info(f"Checking position {checking_pos}")
        interaction_pos = await _probe_deck_at(
            hcapi, mount, checking_pos, edge_settings.pass_settings
        )
        hit_deck = _deck_hit(interaction_pos, checking_pos.z, edge_settings)
        if hit_deck:
            # In this block, we've hit the deck
            LOG.info(f"hit at {interaction_pos}, stride size: {stride}")
            # store the final found Z height found
            # because the height is most accurate next to the edge
            final_z_height_found = interaction_pos
            if copysign(stride, direction_if_hit) == stride:
                # If we're in direction_if_hit direction, the last probe was on the deck,
                # so we want to continue
                stride = stride / 2
            else:
                # if we're against direction_if_hit, the last probe missed,
                # so we want to switch back to narrow things down
                stride = -stride / 2
        else:
            LOG.info(f"Miss at {interaction_pos}, stride size: {stride}")
            # In this block, we've missed the deck
            if copysign(stride, direction_if_hit) == stride:
                # if we are moving in the same direction as direction_if_hit, then we
                # need to reverse - this would be the first time we've missed the deck
                stride = -stride / 2
            else:
                # if we are against direction_if_hit, the last test was off the
                # deck too, so we want to continue
                stride = stride / 2
        checking_pos += search_axis.set_in_point(Point(0, 0, 0), stride)

    try:
        await _verify_edge_pos(
            hcapi, mount, search_axis, checking_pos, abs(stride * 2), direction_if_hit
        )
    except EdgeNotFoundError as e:
        if raise_verify_error:
            raise
        else:
            LOG.warning(e)
    # remove probe offset so we actually get position of the edge
    found_edge = checking_pos - critical_edge_offset(search_axis, direction_if_hit)
    # use the last-found Z height as the edge's most true Z position
    found_edge = found_edge._replace(z=final_z_height_found)
    return found_edge


async def find_slot_center_binary(
    hcapi: OT3API,
    mount: OT3Mount,
    estimated_center: Point,
    raise_verify_error: bool = True,
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
        raise_verify_error,
    )
    LOG.info(f"Found +x edge at {plus_x_edge.x}mm")
    estimated_center = estimated_center._replace(x=plus_x_edge.x - EDGES["right"].x)

    plus_y_edge = await find_edge_binary(
        hcapi, mount, estimated_center + EDGES["top"], OT3Axis.Y, -1, raise_verify_error
    )
    LOG.info(f"Found +y edge at {plus_y_edge.y}mm")
    estimated_center = estimated_center._replace(y=plus_y_edge.y - EDGES["top"].y)

    minus_x_edge = await find_edge_binary(
        hcapi, mount, estimated_center + EDGES["left"], OT3Axis.X, 1, raise_verify_error
    )
    LOG.info(f"Found -x edge at {minus_x_edge.x}mm")
    estimated_center = estimated_center._replace(x=(plus_x_edge.x + minus_x_edge.x) / 2)

    minus_y_edge = await find_edge_binary(
        hcapi,
        mount,
        estimated_center + EDGES["bottom"],
        OT3Axis.Y,
        1,
        raise_verify_error,
    )
    LOG.info(f"Found -y edge at {minus_y_edge.y}mm")
    estimated_center = estimated_center._replace(y=(plus_y_edge.y + minus_y_edge.y) / 2)

    # Found XY center and the average of the edges' Zs
    return estimated_center._replace(
        z=(plus_x_edge.z + minus_x_edge.z + plus_y_edge.z + minus_y_edge.z) / 4,
    )


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
    z_prep_point = nominal_center + PREP_OFFSET_DEPTH
    structure_z = await _probe_deck_at(hcapi, mount, z_prep_point, z_pass_settings)
    z_limit = nominal_center.z - z_pass_settings.max_overrun_distance_mm
    if (structure_z < z_limit) or isclose(z_limit, structure_z, abs_tol=0.001):
        raise CalibrationStructureNotFoundError(structure_z, z_limit)
    LOG.info(f"autocalibration: found structure at {structure_z}")
    return structure_z


async def _probe_deck_at(
    api: OT3API,
    mount: OT3Mount,
    target: Point,
    settings: CapacitivePassSettings,
    speed: float = 50,
) -> float:
    here = await api.gantry_position(mount)
    abs_transit_height = max(
        target.z + LINEAR_TRANSIT_HEIGHT, target.z + settings.prep_distance_mm
    )
    safe_height = max(here.z, target.z, abs_transit_height)
    await api.move_to(mount, here._replace(z=safe_height))
    await api.move_to(mount, target._replace(z=safe_height), speed=speed)
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
    axis: Literal[OT3Axis.X, OT3Axis.Y],
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
    raise_verify_error: bool = True,
) -> Point:

    # Perform xy offset search
    if method == CalibrationMethod.BINARY_SEARCH:
        found_center = await find_slot_center_binary(
            hcapi, mount, nominal_center, raise_verify_error
        )
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
    raise_verify_error: bool = True,
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
    nominal_center = Point(*get_calibration_square_position_in_slot(slot))
    async with hcapi.restore_system_constrants():
        await hcapi.set_system_constraints_for_calibration()
        try:
            # find the center of the calibration sqaure
            offset = await find_calibration_structure_position(
                hcapi,
                mount,
                nominal_center,
                method=method,
                raise_verify_error=raise_verify_error,
            )
            # update center with values obtained during calibration
            LOG.info(f"Found calibration value {offset} for mount {mount.name}")
            return offset

        except (
            InaccurateNonContactSweepError,
            EarlyCapacitiveSenseTrigger,
            CalibrationStructureNotFoundError,
        ):
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
    target: CalibrationTarget = CalibrationTarget.GANTRY_INSTRUMENT,
    raise_verify_error: bool = True,
) -> Point:
    """Find the calibration square offset given an arbitry postition on the deck."""
    # Find the estimated structure plate height. This will be used to baseline the edge detection points.
    z_height = await find_calibration_structure_height(hcapi, mount, nominal_center)
    initial_center = nominal_center._replace(z=z_height)
    LOG.info(f"Found structure plate at {z_height}mm")

    # Find the calibration square center using the given method
    found_center = await find_calibration_structure_center(
        hcapi, mount, initial_center, method, raise_verify_error
    )

    offset = nominal_center - found_center
    # NOTE: If the calibration target is a deck object the polarity of the calibrated
    #  offset needs to be reversed. This is because we are using the gantry instrument
    #  to calibrate a stationary object on the deck and need to find the offset of that
    #  deck object relative to the deck and not the instrument which sits above the deck.
    if target == CalibrationTarget.DECK_OBJECT:
        return offset * -1
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
    nominal_center = Point(*get_calibration_square_position_in_slot(slot))
    offset = await find_calibration_structure_position(
        hcapi, mount, nominal_center, method=CalibrationMethod.BINARY_SEARCH
    )
    return nominal_center - offset, nominal_center


async def _determine_transform_matrix(
    hcapi: OT3API,
    mount: OT3Mount,
) -> types.AttitudeMatrix:
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
    slot_a, slot_b, slot_c = 1, 10, 3
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
    raise_verify_error: bool = True,
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
    async with hcapi.instrument_cache_lock():
        try:
            await hcapi.reset_instrument_offset(OT3Mount.GRIPPER)
            hcapi.add_gripper_probe(probe)
            await hcapi.grip(GRIPPER_GRIP_FORCE)
            offset = await _calibrate_mount(
                hcapi, OT3Mount.GRIPPER, slot, method, raise_verify_error
            )
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
    raise_verify_error: bool = True,
) -> Point:
    """
    Run automatic calibration for pipette.

    Before running this function, make sure that the appropriate probe
    has been attached or prepped on the tool (for instance, a capacitive
    tip has been attached, or the conductive probe has been attached,
    or the probe has been lowered).
    """
    async with hcapi.instrument_cache_lock():
        try:
            await hcapi.reset_instrument_offset(mount)
            await hcapi.add_tip(mount, hcapi.config.calibration.probe_length)
            offset = await _calibrate_mount(
                hcapi, mount, slot, method, raise_verify_error
            )
            await hcapi.save_instrument_offset(mount, offset)
            return offset
        finally:
            await hcapi.remove_tip(mount)


async def calibrate_module(
    hcapi: OT3API,
    mount: OT3Mount,
    slot: str,
    module_id: str,
    nominal_position: Point,
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

    async with hcapi.instrument_cache_lock():
        try:
            # add the probe depending on the mount
            if mount == OT3Mount.GRIPPER:
                hcapi.add_gripper_probe(GripperProbe.FRONT)
            else:
                await hcapi.add_tip(mount, hcapi.config.calibration.probe_length)

            LOG.info(
                f"Starting module calibration for {module_id} at {nominal_position} using {mount}"
            )
            # FIXME (ba, 2023-04-04): Well B1 of the module adapter definition includes the z prep offset
            # of 13x13mm in the nominial position, but we are still using PREP_OFFSET_DEPTH in
            # find_calibration_structure_height which effectively doubles the offset. We plan
            # on removing PREP_OFFSET_DEPTH in the near future, but for now just subtract PREP_OFFSET_DEPTH
            # from the nominal position so we dont have to alter any other part of the system.
            nominal_position = nominal_position - PREP_OFFSET_DEPTH
            offset = await find_calibration_structure_position(
                hcapi,
                mount,
                nominal_position,
                method=CalibrationMethod.BINARY_SEARCH,
                target=CalibrationTarget.DECK_OBJECT,
            )
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
    pipette_id: str,
) -> types.AttitudeMatrix:
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
    async with hcapi.instrument_cache_lock():
        if mount == OT3Mount.GRIPPER:
            raise RuntimeError("Must use pipette mount, not gripper")
        try:
            hcapi.reset_deck_calibration()
            await hcapi.add_tip(mount, hcapi.config.calibration.probe_length)
            belt_attitude = await _determine_transform_matrix(hcapi, mount)
            save_robot_belt_attitude(belt_attitude, pipette_id)
            return belt_attitude
        finally:
            hcapi.load_deck_calibration()
            await hcapi.remove_tip(mount)


def apply_machine_transform(
    belt_attitude: types.AttitudeMatrix,
) -> types.AttitudeMatrix:
    """
    This applies the machine attitude matrix (which happens to be a negative identity) to the belt attitude matrix to form the deck attitude matrix.

    Param
    -----
    belt_attitude: attitude matrix with regards to belt coordinate system

    Returns
    -------
    Attitude matrix with regards to machine coordinate system.
    """
    belt_attitude_arr = np.array(belt_attitude)
    machine_transform_arr = np.array(defaults_ot3.DEFAULT_MACHINE_TRANSFORM)
    deck_attitude_arr = np.dot(belt_attitude_arr, machine_transform_arr)  # type: ignore[no-untyped-call]
    deck_attitude = deck_attitude_arr.round(4).tolist()
    return deck_attitude  # type: ignore[no-any-return]


def load_attitude_matrix(to_default: bool = True) -> DeckCalibration:
    calibration_data = get_robot_belt_attitude()

    if calibration_data and not to_default:
        return DeckCalibration(
            attitude=apply_machine_transform(calibration_data.attitude),
            source=calibration_data.source,
            status=types.CalibrationStatus(**calibration_data.status.dict()),
            belt_attitude=calibration_data.attitude,
            last_modified=calibration_data.lastModified,
            pipette_calibrated_with=calibration_data.pipetteCalibratedWith,
        )
    else:
        # load default if calibration data does not exist
        return DeckCalibration(
            attitude=apply_machine_transform(default_ot3_deck_calibration()),
            source=types.SourceType.default,
            status=types.CalibrationStatus(),
            belt_attitude=default_ot3_deck_calibration(),
        )


def validate_attitude_deck_calibration(
    deck_cal: DeckCalibration,
) -> DeckTransformState:
    """
    This function determines whether the deck calibration is valid
    or not based on the following use-cases:

    TODO(pm, 5/9/2023): As with the OT2, expand on this method,
    or create another method to diagnose bad instrument offset data
    """
    curr_cal = np.array(deck_cal.attitude)
    row, _ = curr_cal.shape
    rank: int = np.linalg.matrix_rank(curr_cal)  # type: ignore
    if row != rank:
        # Check that the matrix is non-singular
        return DeckTransformState.SINGULARITY
    elif not deck_cal.last_modified:
        # Check that the matrix is not an identity
        return DeckTransformState.IDENTITY
    else:
        # Transform as it stands is sufficient.
        return DeckTransformState.OK


def delete_belt_calibration_data(hcapi: OT3API) -> None:
    delete_robot_belt_attitude()
    hcapi.reset_deck_calibration()


class OT3RobotCalibrationProvider:
    """This class provides the following robot calibration data:
    deck calibration: transform matrix to account for stretch of x and y belts
    carriage offset: the vector from the deck origin to the bottom center of the gantry carriage when the gantry is homed
    mount offset (per mount): the vector from the carriage origin (bottom center) to the mount origin (centered on the top peg of the mount flush with the mating face)
    """

    def __init__(self, config: OT3Config) -> None:
        self._robot_calibration = OT3Transforms(
            deck_calibration=load_attitude_matrix(to_default=False),
            carriage_offset=Point(*config.carriage_offset),
            left_mount_offset=Point(*config.left_mount_offset),
            right_mount_offset=Point(*config.right_mount_offset),
            gripper_mount_offset=Point(*config.gripper_mount_offset),
        )

    @lru_cache(1)
    def _validate(self) -> DeckTransformState:
        return validate_attitude_deck_calibration(
            self._robot_calibration.deck_calibration
        )

    @property
    def robot_calibration(self) -> OT3Transforms:
        return self._robot_calibration

    def reset_robot_calibration(self) -> None:
        self._validate.cache_clear()
        self._robot_calibration = OT3Transforms(
            deck_calibration=load_attitude_matrix(to_default=True),
            carriage_offset=Point(*defaults_ot3.DEFAULT_CARRIAGE_OFFSET),
            left_mount_offset=Point(*defaults_ot3.DEFAULT_LEFT_MOUNT_OFFSET),
            right_mount_offset=Point(*defaults_ot3.DEFAULT_RIGHT_MOUNT_OFFSET),
            gripper_mount_offset=Point(*defaults_ot3.DEFAULT_GRIPPER_MOUNT_OFFSET),
        )

    def reset_deck_calibration(self) -> None:
        self._robot_calibration.deck_calibration = load_attitude_matrix(to_default=True)

    def load_deck_calibration(self) -> None:
        self._validate.cache_clear()
        self._robot_calibration.deck_calibration = load_attitude_matrix(
            to_default=False
        )

    def set_robot_calibration(self, robot_calibration: OT3Transforms) -> None:
        self._validate.cache_clear()
        self._robot_calibration = robot_calibration

    def validate_calibration(self) -> DeckTransformState:
        """
        The lru cache decorator is currently not supported by the
        ThreadManager. To work around this, we need to wrap the
        actual function around a dummy outer function.

        Once decorators are more fully supported, we can remove this.
        """
        return self._validate()

    def build_temporary_identity_calibration(self) -> OT3Transforms:
        """
        Get temporary default calibration data suitable for use during
        calibration
        """
        return OT3Transforms(
            deck_calibration=load_attitude_matrix(to_default=True),
            carriage_offset=Point(*defaults_ot3.DEFAULT_CARRIAGE_OFFSET),
            left_mount_offset=Point(*defaults_ot3.DEFAULT_LEFT_MOUNT_OFFSET),
            right_mount_offset=Point(*defaults_ot3.DEFAULT_RIGHT_MOUNT_OFFSET),
            gripper_mount_offset=Point(*defaults_ot3.DEFAULT_GRIPPER_MOUNT_OFFSET),
        )


@dataclass
class OT3Transforms(RobotCalibration):
    carriage_offset: Point
    left_mount_offset: Point
    right_mount_offset: Point
    gripper_mount_offset: Point
