"""Test Width."""
from typing import List, Union, Tuple

from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
    CSVLine,
    CSVLineRepeating,
)

from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import OT3Axis, OT3Mount, Point


SLOT_WIDTH_GAUGE = 5

FAILURE_THRESHOLD_MM = 3
GRIP_HEIGHT_MM = 50
TEST_WIDTHS_MM: List[float] = [60, 80]
GRIP_FORCES_NEWTON: List[float] = [5, 15, 20]


def _get_test_tag(width: float, force: float):
    return f"{width}mm-{force}N"


def _get_width_hover_and_grip_positions(api: OT3API) -> Tuple[Point, Point]:
    grip_pos = helpers_ot3.get_slot_calibration_square_position_ot3(SLOT_WIDTH_GAUGE)
    grip_pos += Point(z=GRIP_HEIGHT_MM)
    hover_pos = grip_pos._replace(z=api.get_instrument_max_height(OT3Mount.GRIPPER))
    return hover_pos, grip_pos


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    for width in TEST_WIDTHS_MM:
        for force in GRIP_FORCES_NEWTON:
            tag = _get_test_tag(width, force)
            lines.append(CSVLine(tag, [float, float, float, CSVResult]))
    return lines


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""
    z_ax = OT3Axis.Z_G
    g_ax = OT3Axis.G
    mount = OT3Mount.GRIPPER

    async def _save_result(_width: float, _force: float) -> None:
        _width_actual = api.jaw_width
        print(f"actual width: {_width_actual}")
        result = CSVResult.from_bool(abs(_width - _width_actual) <= FAILURE_THRESHOLD_MM)
        tag = _get_test_tag(_width, _force)
        report(section, tag, [_force, _width, _width_actual, result])

    # HOME
    print("homing Z and G...")
    await api.home([z_ax, g_ax])
    # MOVE TO SLOT
    hover_pos, target_pos = _get_width_hover_and_grip_positions(api)
    await helpers_ot3.move_to_arched_ot3(api, mount, hover_pos)
    # LOOP THROUGH WIDTHS
    for width in TEST_WIDTHS_MM:
        # OPERATOR SETS UP GAUGE
        ui.print_header(f"SETUP {width} MM GAUGE")
        if not api.is_simulator:
            ui.get_user_ready(f"add {width} mm wide gauge to slot {SLOT_WIDTH_GAUGE}")
        # GRIPPER MOVES TO GAUGE
        await api.ungrip()
        await api.move_to(mount, target_pos)
        if not api.is_simulator:
            ui.get_user_ready(f"prepare to grip {width} mm")
        # LOOP THROUGH FORCES
        for force in GRIP_FORCES_NEWTON:
            # GRIP AND MEASURE WIDTH
            print(f"width(mm): {width}, force(N): {force}")
            # await api.grip(force)
            await api.hold_jaw_width(width)
            await _save_result(width, force)
            await api.ungrip()
        # RETRACT
        print(f"done")
        await helpers_ot3.move_to_arched_ot3(api, mount, hover_pos)
