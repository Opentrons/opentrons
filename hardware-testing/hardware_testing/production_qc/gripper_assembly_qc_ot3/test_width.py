"""Test Width."""
from typing import List, Union

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


FAILURE_THRESHOLD_MM = 3
GRIP_HEIGHT_MM = 30
TEST_WIDTHS_MM: List[float] = [60, 80]
GRIP_FORCES_NEWTON: List[float] = [5, 15, 20]


def _get_test_tag(width: float, force: float):
    return f"{width}mm-{force}N"


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    for width in TEST_WIDTHS_MM:
        for force in GRIP_FORCES_NEWTON:
            tag = _get_test_tag(width, force)
            lines.append(CSVLine(tag, [float, float, CSVResult]))
    return lines


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""
    z_ax = OT3Axis.Z_G
    g_ax = OT3Axis.G
    mount = OT3Mount.GRIPPER
    jaw_width = api._gripper_handler.get_gripper().config.geometry.jaw_width["max"]

    async def _save_result(tag: str, expected: float) -> None:
        await api.refresh_positions()
        jaw_disp = api._encoder_position[g_ax]
        actual = jaw_width - jaw_disp * 2
        result = CSVResult.from_bool(abs(expected - actual) < FAILURE_THRESHOLD_MM)
        report(section, tag, [expected, actual, result])

    for width in TEST_WIDTHS_MM:
        for force in GRIP_FORCES_NEWTON:
            ui.print_header(f"Width(mm): {width}, Force(N): {force}")
            print("homing Z and G...")
            await api.home([z_ax, g_ax])
            print(f"moving down to grip height: {GRIP_HEIGHT_MM} mm")
            await api.move_rel(mount, Point(z=GRIP_HEIGHT_MM))
            print("gripping at {force}N")
            await api.grip(force)
            await _save_result(_get_test_tag(width, force), width)
            print("ungrip")
            await api.ungrip()
            print("homing...")
            await api.home([z_ax])
