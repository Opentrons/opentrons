"""Test Force."""
from asyncio import sleep
from typing import List, Union, Tuple

from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.drivers import find_port, list_ports_and_select
from hardware_testing.drivers.mark10 import Mark10, SimMark10
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVLine,
    CSVResult,
    CSVLineRepeating,
)

from hardware_testing.data import ui
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import OT3Axis, OT3Mount, Point


SLOT_FORCE_GAUGE = 4
GRIP_FORCES_NEWTON = [5, 8, 12, 15, 18, 20]
GRIP_HEIGHT_MM = 65

FAILURE_THRESHOLD_PERCENTAGE = 10
FORCE_GAUGE_PORT = "/dev/ttyUSB0"


def _get_test_tag(force: float) -> str:
    return f"{force}N"


def _get_gauge(is_simulating: bool) -> Union[Mark10, SimMark10]:
    if is_simulating:
        return SimMark10()
    else:
        try:
            port = find_port(*Mark10.vid_pid())
        except RuntimeError:
            port = list_ports_and_select("Mark10 Force Gauge")
        print(f"Setting up force gauge at port: {FORCE_GAUGE_PORT}")
        return Mark10.create(port=port)


def _get_force_gauge_hover_and_grip_positions(api: OT3API) -> Tuple[Point, Point]:
    grip_pos = helpers_ot3.get_slot_calibration_square_position_ot3(SLOT_FORCE_GAUGE)
    grip_pos += Point(z=GRIP_HEIGHT_MM)
    hover_pos = grip_pos._replace(z=api.get_instrument_max_height(OT3Mount.GRIPPER))
    return hover_pos, grip_pos


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

    # OPERATOR SETS UP GAUGE
    ui.print_header("SETUP FORCE GAUGE")
    if not api.is_simulator:
        ui.get_user_ready(f"add gauge to slot {SLOT_FORCE_GAUGE}")
        ui.get_user_ready("plug gauge into USB port on OT3")
    gauge = _get_gauge(api.is_simulator)
    gauge.connect()

    async def _save_result(tag: str, expected: float, length: int = 10) -> None:
        if gauge.is_simulator():
            gauge.set_simulation_force(expected)  # type: ignore[union-attr]
        actual = sum([float(gauge.read_force()) for _ in range(length)]) / float(length)
        print(f"reading: {actual} N")
        error = (actual - expected) / expected
        result = CSVResult.from_bool(abs(error) * 100 < FAILURE_THRESHOLD_PERCENTAGE)
        report(section, tag, [expected, actual, result])

    ui.print_header("TEST FORCE")
    # HOME
    print("homing Z and G...")
    await api.home([z_ax, g_ax])
    # MOVE TO GAUGE
    await api.ungrip()
    hover_pos, target_pos = _get_force_gauge_hover_and_grip_positions(api)
    await helpers_ot3.move_to_arched_ot3(api, mount, hover_pos)
    if not api.is_simulator:
        ui.get_user_ready("ATTACH the jaw extenders")
        ui.get_user_ready("confirm jaw extenders are pressed down again PADDLES")
    await api.move_to(mount, target_pos)
    if not api.is_simulator:
        ui.get_user_ready("prepare to grip")
    # LOOP THROUGH FORCES
    for force in GRIP_FORCES_NEWTON:
        # GRIP AND MEASURE FORCE
        print(f"gripping at {force} N")
        await api.grip(force)
        if not api.is_simulator:
            await sleep(2)
        await _save_result(_get_test_tag(force), force)
        print("ungrip")
        await api.ungrip()
    # RETRACT
    print("done")
    await helpers_ot3.move_to_arched_ot3(api, mount, hover_pos)
    if not api.is_simulator:
        ui.get_user_ready("REMOVE the jaw extenders")
