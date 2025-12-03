"""Protocol version of belt calibration, does not create CSV reports."""
from opentrons.protocol_api import ProtocolContext, ParameterContext
from opentrons.hardware_control.types import OT3Mount
from opentrons.types import Point
from typing import Optional, Dict, Tuple, Any, List
from dataclasses import dataclass
from opentrons.calibration_storage.types import AttitudeMatrix
from opentrons.config.defaults_ot3 import DEFAULT_MACHINE_TRANSFORM
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.ot3_calibration import (
    calibrate_belts,
    calibrate_pipette,
    find_pipette_offset,
)
from opentrons_shared_data.errors.exceptions import (
    EarlyCapacitiveSenseTrigger,
    EdgeNotFoundError,
    CalibrationStructureNotFoundError,
    MisalignedGantryError,
)
from opentrons_shared_data.deck import load as load_deck

metadata = {"protocolName": "PM Belt calibration"}

requirements = {"robotType": "Flex", "apiLevel": "2.27"}


MAX_ERROR_DISTANCE_MM = 0.5

TEST_SLOTS = [1, 3, 9, 10]


@dataclass
class CalibrationSquare:
    """Calibration Square."""

    top_left_offset: Point
    width: float
    height: float
    depth: float


@dataclass
class CalibrationProbe:
    """Calibration Probe."""

    length: float
    diameter: float


@dataclass
class _TestBeltCalibrationData:
    pipette_offset: Point
    deck_offsets: Dict[int, Point]


# values are from "Robot Extents" sheet
CALIBRATION_SQUARE_OFFSET_EVT = Point(x=64, y=-43, z=-0.25)
CALIBRATION_SQUARE_EVT = CalibrationSquare(
    top_left_offset=CALIBRATION_SQUARE_OFFSET_EVT, width=20, height=20, depth=3
)
CALIBRATION_PROBE_EVT = CalibrationProbe(length=44.5, diameter=4.0)


def add_parameters(parameters: ParameterContext) -> None:
    """Build the runtime parameters."""
    parameters.add_bool(
        display_name="Perform calibration",
        variable_name="do_calibration",
        default=False,
        description="When this is true the robot will perform a calibration, otherwise it will just check calibration",
    )


def get_slot_bottom_left_position_ot3(slot: int) -> Point:
    """Get slot bottom-left position.

    Params:
        slot: The OT-3 slot, specified as an OT-2-style slot number.
            For example, specify 5 to get slot C2.
    """
    deck = load_deck("ot3_standard", version=3)
    slots = deck["locations"]["orderedSlots"]

    # Assume that the OT-3 deck definition has the same number of slots, and in the same order,
    # as the OT-2.
    # TODO(mm, 2023-05-22): This assumption will break down when the OT-3 has staging area slots.
    # https://opentrons.atlassian.net/browse/RLAB-345
    s = slots[slot - 1]

    return Point(*s["position"])


def get_slot_size() -> Point:
    """Get OT3 Slot Size."""
    deck = load_deck("ot3_standard", version=3)
    slots = deck["locations"]["orderedSlots"]
    bounding_box = slots[0]["boundingBox"]
    return Point(
        x=bounding_box["xDimension"],
        y=bounding_box["yDimension"],
        z=bounding_box["zDimension"],
    )


def get_slot_top_left_position_ot3(slot: int) -> Point:
    """Get slot top-left position.

    Params:
        slot: The OT-3 slot, specified as an OT-2-style slot number.
            For example, specify 5 to get slot C2.
    """
    bottom_left = get_slot_bottom_left_position_ot3(slot)
    slot_size = get_slot_size()
    return bottom_left + Point(y=slot_size.y)


def get_slot_calibration_square_position_ot3(slot: int) -> Point:
    """Get slot calibration block position.

    Params:
        slot: The OT-3 slot, specified as an OT-2-style slot number.
            For example, specify 5 to get slot C2.
    """
    slot_top_left = get_slot_top_left_position_ot3(slot)
    calib_sq_offset = CALIBRATION_SQUARE_EVT.top_left_offset
    return slot_top_left + calib_sq_offset


async def _calibrate_pipette(self, mount: OT3Mount) -> Point:  # noqa: ANN001
    await self.home()
    try:
        offset = await calibrate_pipette(self, mount)  # type: ignore[arg-type]
    except CalibrationStructureNotFoundError as e:
        if not self.is_simulator:
            raise e
        offset = Point(x=0, y=0, z=0)
    finally:
        await self.retract(mount)
    return offset


async def _check_belt_accuracy(
    self, mount: OT3Mount  # noqa: ANN001
) -> Dict[int, Point]:
    ret = {}
    for slot in TEST_SLOTS:
        await self.home()
        try:
            slot_offset = await find_pipette_offset(
                self, mount, slot=slot, reset_instrument_offset=False  # type: ignore[arg-type]
            )
            ret[slot] = slot_offset
        except CalibrationStructureNotFoundError as e:
            if self.is_simulator:
                ret[slot] = Point(x=0, y=0, z=0)
            else:
                raise e
        await self.home_z(mount)
    return ret


async def _calibrate_belts(
    self, mount: OT3Mount  # noqa: ANN001
) -> Tuple[AttitudeMatrix, Dict[str, Any]]:
    pip = self.hardware_pipettes[mount.to_mount()]
    assert pip, "no pipette found"
    await self.home()
    try:
        pip_id = pip.pipette_id if pip and pip.pipette_id else "unknown"
        attitude, details = await calibrate_belts(self, mount, pip_id)
    except CalibrationStructureNotFoundError as e:
        if not self.is_simulator:
            raise e
        attitude = DEFAULT_MACHINE_TRANSFORM
        details = {}
    return attitude, details


def run_belt_calibration(
    ctx: ProtocolContext,
) -> Tuple[
    Optional[_TestBeltCalibrationData],
    Optional[AttitudeMatrix],
    Optional[Dict[str, Any]],
    Optional[_TestBeltCalibrationData],
]:
    """Do the belt accuracy test and maybe create calibration data depending on RTP."""
    OT3API._calibrate_pipette = _calibrate_pipette  # type: ignore[attr-defined]
    OT3API._check_belt_accuracy = _check_belt_accuracy  # type: ignore[attr-defined]
    OT3API._calibrate_belts = _calibrate_belts  # type: ignore[attr-defined]
    api = ctx._core.get_hardware()
    api.home()
    mount = OT3Mount.LEFT
    attach_pos = get_slot_calibration_square_position_ot3(4)
    current_pos = api.gantry_position(mount)
    api.move_to(mount, attach_pos._replace(z=current_pos.z))
    api.move_rel(mount, Point(x=0, y=0, z=-20))
    ctx.pause("Attach probe to pipette")

    without_data: Optional[_TestBeltCalibrationData] = None
    with_data: Optional[_TestBeltCalibrationData] = None
    attitude: Optional[AttitudeMatrix] = None
    details: Optional[Dict[str, Any]] = None
    try:
        # calibrate belts
        if ctx.params.do_calibration:  # type: ignore[attr-defined]
            ctx.comment("CALIBRATE BELTS")
            api.reset_instrument_offset(mount)
            attitude, details = api._calibrate_belts(mount)

        # test after
        ctx.comment("TEST WITH CALIBRATION")
        with_data = _TestBeltCalibrationData(
            pipette_offset=api._calibrate_pipette(mount),
            deck_offsets=api._check_belt_accuracy(mount),
        )
        ctx.comment("TEST WITHOUT CALIBRATION")
        api.reset_robot_calibration()  # set NOMINAL belt calibration
        without_data = _TestBeltCalibrationData(
            pipette_offset=api._calibrate_pipette(mount),
            deck_offsets=api._check_belt_accuracy(mount),
        )
    finally:
        api.retract(mount)

    current_pos = api.gantry_position(mount)
    api.move_to(mount, attach_pos._replace(z=current_pos.z))
    api.move_rel(mount, Point(x=0, y=0, z=-20))
    ctx.pause("Remove probe from pipette")
    return without_data, attitude, details, with_data


def run(ctx: ProtocolContext) -> None:
    """Main entry to protocol."""
    ctx.comment("starting belt calibration.")

    if not ctx.is_simulating():
        try:
            before, attitude, details, after = run_belt_calibration(ctx)
        except (
            EarlyCapacitiveSenseTrigger,
            EdgeNotFoundError,
            CalibrationStructureNotFoundError,
            MisalignedGantryError,
        ) as e:
            ctx.pause(f"{str(e)}")
            raise e
        if before and after:
            results: List[float] = []
            zero = Point(x=0, y=0, z=0)
            for slot in TEST_SLOTS:
                dist_after = after.deck_offsets[slot].magnitude_to(zero)
                results.append(dist_after)
            passing = max(results) <= MAX_ERROR_DISTANCE_MM
    else:
        passing = True
    ctx.pause(f"Belt calibration pass: {passing}")
