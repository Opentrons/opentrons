"""Test Force."""
from typing import List, Union

from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.drivers.mark10 import Mark10
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVLine,
    CSVResult,
    CSVLineRepeating,
)

from hardware_testing.data import ui
from hardware_testing.opentrons_api.types import OT3Axis, OT3Mount, Point


GRIP_FORCES_NEWTON = [5, 8, 12, 15, 18, 20]
GRIP_HEIGHT_MM = 30

FAILURE_THRESHOLD_PERCENTAGE = 10
FORCE_GAUGE_PORT = "/dev/ttyUSB0"


def _get_test_tag(force: float):
    return f"{force}N"


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    for force in GRIP_FORCES_NEWTON:
        tag = _get_test_tag(force)
        lines.append(CSVLine(tag, [float, float, CSVResult]))
    return lines


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""
    z_ax = OT3Axis.Z_G
    g_ax = OT3Axis.G
    mount = OT3Mount.GRIPPER

    print(f"Setting up force gauge at port: {FORCE_GAUGE_PORT}")
    # if not api.is_simulator:
    #     gauge = Mark10.create(port=FORCE_GAUGE_PORT)
    #     gauge.connect()

    async def _save_result(tag: str, expected: float) -> None:
        # if api.is_simulator:
        #     actual = 5.0
        # else:
        #     actual = float(gauge.read_force())
        actual = 5.0
        error = (actual - expected) / expected
        result = CSVResult.from_bool(abs(error) * 100 < FAILURE_THRESHOLD_PERCENTAGE)
        report(section, tag, [expected, actual, result])

    print("homing Z and G...")
    await api.home([z_ax, g_ax])
    current_pos = await api.gantry_position(OT3Mount.GRIPPER)
    print(f"moving down to grip height: {GRIP_HEIGHT_MM} mm")
    await api.move_to(mount, current_pos._replace(z=GRIP_HEIGHT_MM))
    for force in GRIP_FORCES_NEWTON:
        ui.print_header(f"Grip force (N): {force}")
        print(f"gripping at {force} N")
        await api.grip(force)
        print("taking force reading")
        await _save_result(_get_test_tag(force), force)
        print("ungrip")
        await api.ungrip()
    print("homing...")
    await api.home([z_ax])
