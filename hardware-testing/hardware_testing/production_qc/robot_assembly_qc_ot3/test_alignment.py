"""Test Alignment."""
from typing import List, Union
from typing_extensions import Final

from opentrons.config.defaults_ot3 import DEFAULT_DECK_TRANSFORM
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.ot3_calibration import (
    find_deck_height,
    find_slot_center_linear,
)

from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
    CSVLine,
    CSVLineRepeating,
)
from hardware_testing.opentrons_api import helpers_ot3, types
from hardware_testing.opentrons_api.types import Point, OT3Mount
from hardware_testing.data import ui


ATTACH_DETACH_POS = helpers_ot3.get_slot_calibration_square_position_ot3(4)
EXPECTED_POINTS = {
    1: helpers_ot3.get_slot_calibration_square_position_ot3(1),
    3: helpers_ot3.get_slot_calibration_square_position_ot3(3),
    10: helpers_ot3.get_slot_calibration_square_position_ot3(10),
}
SLOT_10_TO_SLOT_3 = Point(y=-1 * (EXPECTED_POINTS[10].y - EXPECTED_POINTS[3].y))
SLOT_3_TO_SLOT_1 = Point(x=-1 * (EXPECTED_POINTS[3].x - EXPECTED_POINTS[1].x))

ALIGNMENT_TESTS: Final = [
    "alignment-x",
    "alignment-y",
    "flatness-x",
    "flatness-y",
]
ALIGNMENT_THRESHOLDS: Final = {t: 0.3 for t in ALIGNMENT_TESTS}

MOVE_FROM_HOME_SPEED = 200


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    for t in ALIGNMENT_TESTS:
        lines.append(CSVLine(t, [float, CSVResult]))
    return lines


async def _find_slot(api: OT3API, mount: OT3Mount, expected: Point) -> Point:
    if not api.is_simulator:
        pos = await api.gantry_position(mount)
        await api.move_to(mount, pos._replace(z=max(pos.z, 100)))
        z_height = await find_deck_height(api, mount, expected)
        actual = await find_slot_center_linear(
            api, mount, expected._replace(z=z_height)
        )
    else:
        actual = expected + Point()
    return actual


def _assert_deck_transform_is_default(api: OT3API) -> None:
    att_matrix = api.config.deck_transform
    for def_row, att_row in zip(DEFAULT_DECK_TRANSFORM, att_matrix):
        for default_val, current_val in zip(def_row, att_row):
            assert (
                current_val == default_val
            ), f"deck transform is not equal to default: {att_matrix}"


async def _move_to_accessible_spot(api: OT3API, mount: OT3Mount, arch_z: float) -> None:
    pos = await api.gantry_position(mount)
    await api.move_to(
        mount,
        pos._replace(z=arch_z),
        critical_point=types.CriticalPoint.MOUNT,
        speed=MOVE_FROM_HOME_SPEED,
    )
    await api.move_to(
        mount,
        ATTACH_DETACH_POS._replace(z=arch_z),
        critical_point=types.CriticalPoint.MOUNT,
        speed=MOVE_FROM_HOME_SPEED,
    )
    await api.move_rel(mount, Point(z=-20))


async def _wait_for_pipette(api: OT3API, mount: OT3Mount, present: bool) -> None:
    await api.cache_instruments()
    if api.is_simulator:
        return
    is_present = api.hardware_pipettes[mount.to_mount()]
    if present and not is_present:
        ui.get_user_ready(f"ATTACH pipette to the {mount.value} mount")
        return await _wait_for_pipette(api, mount, present)
    elif not present and is_present:
        ui.get_user_ready(f"REMOVE pipette from the {mount.value} mount")
        return await _wait_for_pipette(api, mount, present)


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""
    _assert_deck_transform_is_default(api)
    print("homing")
    await api.home()
    mount = OT3Mount.LEFT
    cp = types.CriticalPoint.MOUNT  # not pipette or tip, for consistency
    home_pos = await api.gantry_position(mount, critical_point=cp)

    # prepare the deck
    if not api.is_simulator:
        ui.get_user_ready("INSTALL calibration squares into SLOTS 1, 3, and 10")

    # ATTACH PIPETTE
    ui.print_header("ATTACH PIPETTE + PROBE")
    print("moving to accessible position")
    await _move_to_accessible_spot(api, mount, arch_z=home_pos.z)
    await _wait_for_pipette(api, mount, True)
    if not api.is_simulator:
        ui.get_user_ready("attached a CALIBRATION-PROBE to the pipette")
    await api.add_tip(mount, helpers_ot3.CALIBRATION_PROBE_EVT.length)

    # PROBE SLOTS
    ui.print_header("PROBE SLOTS 10, 3, 1")
    actual_10 = await _find_slot(api, mount, EXPECTED_POINTS[10])
    actual_3 = await _find_slot(api, mount, actual_10 + SLOT_10_TO_SLOT_3)
    actual_1 = await _find_slot(api, mount, actual_3 + SLOT_3_TO_SLOT_1)
    print("retracting")
    pos = await api.gantry_position(mount, critical_point=cp)
    await api.move_to(mount, pos._replace(z=home_pos.z))

    # calculate alignment
    alignment_x = actual_3.x - actual_10.x  # front to rear
    alignment_y = actual_1.y - actual_3.y  # left to right
    flatness_x = actual_1.z - actual_3.z  # left to right
    flatness_y = actual_3.z - actual_10.z  # front to rear
    # compare to thresholds
    alignment_x_passed = abs(alignment_x) < ALIGNMENT_THRESHOLDS["alignment-x"]
    alignment_y_passed = abs(alignment_y) < ALIGNMENT_THRESHOLDS["alignment-y"]
    flatness_x_passed = abs(flatness_x) < ALIGNMENT_THRESHOLDS["flatness-x"]
    flatness_y_passed = abs(flatness_y) < ALIGNMENT_THRESHOLDS["flatness-y"]
    # store in report
    report(
        section, "alignment-x", [alignment_x, CSVResult.from_bool(alignment_x_passed)]
    )
    report(
        section, "alignment-y", [alignment_y, CSVResult.from_bool(alignment_y_passed)]
    )
    report(section, "flatness-x", [flatness_x, CSVResult.from_bool(flatness_x_passed)])
    report(section, "flatness-y", [flatness_y, CSVResult.from_bool(flatness_y_passed)])

    ui.print_header("REMOVE PIPETTE")
    print("moving to accessible position")
    await _move_to_accessible_spot(api, mount, arch_z=home_pos.z)
    await api.remove_tip(mount)
    await _wait_for_pipette(api, mount, True)
    await api.move_to(
        mount,
        home_pos + Point(x=-1, y=-1, z=-1),
        critical_point=cp,
        speed=MOVE_FROM_HOME_SPEED,
    )
