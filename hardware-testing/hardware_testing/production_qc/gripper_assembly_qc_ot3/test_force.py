"""Test Force."""
from asyncio import sleep
from typing import List, Union, Tuple, Optional

from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.types import GripperJawState

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
from hardware_testing.opentrons_api.types import Axis, OT3Mount, Point


SLOT_FORCE_GAUGE = 4
GRIP_HEIGHT_MM = 120

FAILURE_THRESHOLD_PERCENTAGE = 10
GRIP_FORCES_NEWTON: List[int] = [5, 10, 15, 20]

NUM_DUTY_CYCLE_TRIALS = 5
GRIP_DUTY_CYCLES: List[int] = [6, 8, 10, 12, 15, 20, 30, 40, 50]


def _get_test_tag(
    newtons: Optional[int] = None, duty_cycle: Optional[int] = None
) -> str:
    if newtons and duty_cycle:
        raise ValueError("must measure either force or duty-cycle, not both")
    if newtons is None and duty_cycle is None:
        raise ValueError("both newtons and duty-cycle are None")
    if newtons is not None:
        return f"{newtons}-newtons"
    else:
        return f"{duty_cycle}-duty-cycle"


def _get_gauge(is_simulating: bool) -> Union[Mark10, SimMark10]:
    if is_simulating:
        return SimMark10()
    else:
        try:
            port = find_port(*Mark10.vid_pid())
        except RuntimeError:
            port = list_ports_and_select("Mark10 Force Gauge")
        print(f"Setting up force gauge at port: {port}")
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
        tag = _get_test_tag(newtons=force)
        lines.append(CSVLine(tag, [int, float, CSVResult]))
    for duty_cycle in GRIP_DUTY_CYCLES:
        tag = _get_test_tag(duty_cycle=duty_cycle)
        lines.append(CSVLine(tag, [int, float, CSVResult]))
    return lines


async def _read_average_force_from_gauge(
    gauge: Union[Mark10, SimMark10], length: int = 10, interval: float = 0.25
) -> float:
    n = list()
    for _ in range(length):
        n.append(gauge.read_force())
        if not gauge.is_simulator():
            await sleep(interval)
    return sum(n) / float(length)


async def _grip_and_read_force(
    api: OT3API,
    gauge: Union[Mark10, SimMark10],
    force: Optional[int] = None,
    duty: Optional[int] = None,
) -> float:
    if duty is not None:
        await api._grip(duty_cycle=float(duty))
        api._gripper_handler.set_jaw_state(GripperJawState.GRIPPING)
    else:
        assert force is not None
        await api.grip(float(force))
    if gauge.is_simulator():
        if duty is not None:
            gauge.set_simulation_force(float(duty) * 0.5)  # type: ignore[union-attr]
        elif force is not None:
            gauge.set_simulation_force(float(force))  # type: ignore[union-attr]
    if not api.is_simulator:
        await sleep(2)
    ret = await _read_average_force_from_gauge(gauge)
    await api.ungrip()
    return ret


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""
    z_ax = Axis.Z_G
    g_ax = Axis.G
    mount = OT3Mount.GRIPPER

    # OPERATOR SETS UP GAUGE
    ui.print_header("SETUP FORCE GAUGE")
    if not api.is_simulator:
        ui.get_user_ready(f"add gauge to slot {SLOT_FORCE_GAUGE}")
        ui.get_user_ready("plug gauge into USB port on OT3")
    gauge = _get_gauge(api.is_simulator)
    gauge.connect()

    # HOME
    print("homing Z and G...")
    await api.home([z_ax, g_ax])
    # MOVE TO GAUGE
    await api.ungrip()
    hover_pos, _ = _get_force_gauge_hover_and_grip_positions(api)
    target_pos = Point(x=64.0, y=123.3, z=67.6)
    await helpers_ot3.move_to_arched_ot3(api, mount, target_pos._replace(z=87.6))
    if not api.is_simulator:
        ui.get_user_ready("please make sure the gauge in the middle of the gripper")
    await api.move_to(mount, target_pos)
    if not api.is_simulator:
        ui.get_user_ready("prepare to grip")

    # LOOP THROUGH FORCES
    ui.print_header("MEASURE NEWTONS")
    for expected_force in GRIP_FORCES_NEWTON:
        # GRIP AND MEASURE FORCE
        actual_force = await _grip_and_read_force(api, gauge, force=expected_force)
        print(f"gripping at {expected_force} N = {actual_force} N")
        error = (actual_force - expected_force) / expected_force
        result = CSVResult.from_bool(abs(error) * 100 < FAILURE_THRESHOLD_PERCENTAGE)
        tag = _get_test_tag(newtons=expected_force)
        report(section, tag, [expected_force, actual_force, result])
    # LOOP THROUGH DUTY-CYCLES
    ui.print_header("MEASURE DUTY-CYCLES")
    for duty_cycle in GRIP_DUTY_CYCLES:
        # GRIP AND MEASURE FORCE
        print(f"gripping at {duty_cycle}% duty cycle")
        found_forces = list()
        # take 2x extra samples, because we'll remove min/max later
        for i in range(NUM_DUTY_CYCLE_TRIALS + 2):
            actual_force = await _grip_and_read_force(api, gauge, duty=duty_cycle)
            print(f" - trial {i + 1}/{NUM_DUTY_CYCLE_TRIALS} = {actual_force} N")
            found_forces.append(actual_force)
        # remove min/max forces
        forces_without_outliers = sorted(found_forces)[1:-1]
        # calculate average
        actual_force = sum(forces_without_outliers) / float(NUM_DUTY_CYCLE_TRIALS)
        print(f"average = {actual_force} N")
        tag = _get_test_tag(duty_cycle=duty_cycle)
        report(section, tag, [duty_cycle, actual_force, CSVResult.PASS])
    # RETRACT
    print("done")
    await helpers_ot3.move_to_arched_ot3(api, mount, hover_pos)
