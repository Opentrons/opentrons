"""Test Alignment."""
from typing import List, Union
from typing_extensions import Final

try:
    from opentrons.config.defaults_ot3 import (
        DEFAULT_MACHINE_TRANSFORM as DEFAULT_TRANSFORM,
    )
except ImportError as e:
    print(e)
    # FIXME: delete this once there is no risk of machines running <=0.7.0
    from opentrons.config.defaults_ot3 import (  # type: ignore[attr-defined, no-redef]
        DEFAULT_DECK_TRANSFORM as DEFAULT_TRANSFORM,
    )
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.ot3_calibration import (
    find_calibration_structure_height,
    find_slot_center_binary,
    EdgeNotFoundError,
)

from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
    CSVLine,
    CSVLineRepeating,
)
from hardware_testing.opentrons_api import helpers_ot3, types
from hardware_testing.opentrons_api.types import Axis, Point, OT3Mount
from hardware_testing.data import ui


ATTACH_DETACH_POS = helpers_ot3.get_slot_calibration_square_position_ot3(4)
PROBE_SLOTS: Final = {
    "back-left": 10,
    "front-left": 1,
    "front-right": 3,
}
EXPECTED_POINTS = {
    t: helpers_ot3.get_slot_calibration_square_position_ot3(s)
    for t, s in PROBE_SLOTS.items()
}

ALIGNMENT_THRESHOLDS: Final = {
    "alignment-x": 0.3,
    "alignment-y": 0.2,
    "flatness-x": 0.2,
    "flatness-y": 0.3,
}

MOVE_FROM_HOME_SPEED = 200


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    for t in ALIGNMENT_THRESHOLDS.keys():
        lines.append(CSVLine(t, [float, CSVResult]))
    return lines


async def _find_slot(api: OT3API, mount: OT3Mount, expected: Point) -> Point:
    if not api.is_simulator:
        pos = await api.gantry_position(mount)
        await api.move_to(mount, pos._replace(z=max(pos.z, 100)))
        z_height = await find_calibration_structure_height(api, mount, expected)
        actual = await find_slot_center_binary(
            api, mount, expected._replace(z=z_height)
        )
    else:
        actual = expected + Point()
    return actual


def _assert_deck_transform_is_default(api: OT3API) -> None:
    att_matrix = api.config.deck_transform
    for def_row, att_row in zip(DEFAULT_TRANSFORM, att_matrix):
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
        ui.get_user_ready(f"ATTACH pipette to the {mount.name} mount")
        return await _wait_for_pipette(api, mount, present)
    elif not present and is_present:
        ui.get_user_ready(f"REMOVE pipette from the {mount.name} mount")
        return await _wait_for_pipette(api, mount, present)


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""
    if not api.is_simulator:
        if not ui.get_user_answer("use a pipette to probe the deck to test alignment"):
            return

    _assert_deck_transform_is_default(api)
    print("homing")
    await api.home([Axis.Z_L, Axis.Z_R])
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
        ui.get_user_ready("attach a CALIBRATION-PROBE to the pipette")
    await api.add_tip(mount, helpers_ot3.CALIBRATION_PROBE_EVT.length)

    # PROBE SLOTS
    slots_msg = ", ".join([str(s) for s in PROBE_SLOTS.values()])
    ui.print_header(f"PROBE SLOTS {slots_msg}")
    if not api.is_simulator:
        ui.get_user_ready(f"check SLOTS {slots_msg} are ready to be probed")
    try:
        actual_pos = {
            k: await _find_slot(api, mount, p) for k, p in EXPECTED_POINTS.items()
        }
    except EdgeNotFoundError as e:
        print(e)
        ui.print_error("unable to probe slot, maybe the gantry is skipping?")
    else:
        # calculate alignment
        alignment_x = actual_pos["front-left"].x - actual_pos["back-left"].x
        alignment_y = actual_pos["front-left"].y - actual_pos["front-right"].y
        flatness_x = actual_pos["front-left"].z - actual_pos["front-right"].z
        flatness_y = actual_pos["front-left"].z - actual_pos["back-left"].z
        print(f"alignment-x: {alignment_x}")
        print(f"alignment-y: {alignment_y}")
        print(f"flatness-x: {flatness_x}")
        print(f"flatness-y: {flatness_y}")
        # compare to thresholds
        alignment_x_passed = abs(alignment_x) < ALIGNMENT_THRESHOLDS["alignment-x"]
        alignment_y_passed = abs(alignment_y) < ALIGNMENT_THRESHOLDS["alignment-y"]
        flatness_x_passed = abs(flatness_x) < ALIGNMENT_THRESHOLDS["flatness-x"]
        flatness_y_passed = abs(flatness_y) < ALIGNMENT_THRESHOLDS["flatness-y"]
        # store in report
        report(
            section,
            "alignment-x",
            [alignment_x, CSVResult.from_bool(alignment_x_passed)],
        )
        report(
            section,
            "alignment-y",
            [alignment_y, CSVResult.from_bool(alignment_y_passed)],
        )
        report(
            section, "flatness-x", [flatness_x, CSVResult.from_bool(flatness_x_passed)]
        )
        report(
            section, "flatness-y", [flatness_y, CSVResult.from_bool(flatness_y_passed)]
        )

    ui.print_header("REMOVE PIPETTE")
    pos = await api.gantry_position(mount, critical_point=cp)
    await api.move_to(mount, pos._replace(z=home_pos.z))
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
