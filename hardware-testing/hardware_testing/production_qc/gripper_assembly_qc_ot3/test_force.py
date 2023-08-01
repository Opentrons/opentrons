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

GRIP_DUTY_CYCLES: List[int] = [40, 30, 25, 20, 15, 10, 6]
NUM_DUTY_CYCLE_TRIALS = 20

GRIP_FORCES_NEWTON: List[int] = [20, 15, 10, 5]
NUM_NEWTONS_TRIALS = 1
FAILURE_THRESHOLD_PERCENTAGES = [10, 10, 10, 20]

WARMUP_SECONDS = 10

FORCE_GAUGE_TRIAL_SAMPLE_INTERVAL = 0.25  # seconds
FORCE_GAUGE_TRIAL_SAMPLE_COUNT = 20  # 20 samples = 5 seconds @ 4Hz

GAUGE_OFFSET = Point(x=2, y=-42, z=75)


def _get_test_tag(
    trial: int,
    newtons: Optional[int] = None,
    duty_cycle: Optional[int] = None,
) -> str:
    if newtons and duty_cycle:
        raise ValueError("must measure either force or duty-cycle, not both")
    if newtons is None and duty_cycle is None:
        raise ValueError("both newtons and duty-cycle are None")
    if newtons is not None:
        return f"newtons-{newtons}-trial-{trial + 1}"
    else:
        return f"duty-cycle-{duty_cycle}-trial-{trial + 1}"


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
    grip_pos += GAUGE_OFFSET
    hover_pos = grip_pos._replace(z=api.get_instrument_max_height(OT3Mount.GRIPPER))
    return hover_pos, grip_pos


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    for force in GRIP_FORCES_NEWTON:
        for trial in range(NUM_NEWTONS_TRIALS):
            tag = _get_test_tag(trial, newtons=force)
            force_data_types = [float] * FORCE_GAUGE_TRIAL_SAMPLE_COUNT
            lines.append(CSVLine(f"{tag}-data", force_data_types))
            lines.append(CSVLine(f"{tag}-average", [float]))
            lines.append(CSVLine(f"{tag}-target", [float]))
            lines.append(CSVLine(f"{tag}-pass-%", [float]))
            lines.append(CSVLine(f"{tag}-result", [CSVResult]))
    for duty_cycle in GRIP_DUTY_CYCLES:
        for trial in range(NUM_DUTY_CYCLE_TRIALS):
            tag = _get_test_tag(trial, duty_cycle=duty_cycle)
            force_data_types = [float] * FORCE_GAUGE_TRIAL_SAMPLE_COUNT
            lines.append(CSVLine(f"{tag}-data", force_data_types))
            lines.append(CSVLine(f"{tag}-average", [float]))
            lines.append(CSVLine(f"{tag}-duty-cycle", [float]))
    return lines


async def _read_forces(gauge: Union[Mark10, SimMark10]) -> List[float]:
    n = list()
    for _ in range(FORCE_GAUGE_TRIAL_SAMPLE_COUNT):
        force = gauge.read_force()
        n.append(force)
        if not gauge.is_simulator():
            await sleep(FORCE_GAUGE_TRIAL_SAMPLE_INTERVAL)
    return n


async def _grip_and_read_forces(
    api: OT3API,
    gauge: Union[Mark10, SimMark10],
    force: Optional[int] = None,
    duty: Optional[int] = None,
) -> List[float]:
    if not api.is_simulator:
        await sleep(2)  # let sensor settle
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
    ret_list = await _read_forces(gauge)
    await api.ungrip()
    return ret_list


async def _setup(api: OT3API) -> Union[Mark10, SimMark10]:
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
    print("test readings")
    ret_list = await _read_forces(gauge)
    print(ret_list)

    # HOME
    print("homing Z and G...")
    await api.home([z_ax, g_ax])
    # MOVE TO GAUGE
    await api.ungrip()
    _, target_pos = _get_force_gauge_hover_and_grip_positions(api)
    await helpers_ot3.move_to_arched_ot3(api, mount, target_pos + Point(z=15))
    if not api.is_simulator:
        ui.get_user_ready("please make sure the gauge in the middle of the gripper")
    await helpers_ot3.jog_mount_ot3(api, OT3Mount.GRIPPER)
    if not api.is_simulator:
        ui.get_user_ready("about to grip")
    await api.grip(20)
    for sec in range(WARMUP_SECONDS):
        print(f"warmup ({sec + 1}/{WARMUP_SECONDS})")
        if not api.is_simulator:
            await sleep(1)
    await api.ungrip()
    return gauge


async def run_increment(api: OT3API, report: CSVReport, section: str) -> None:
    """Run Increment."""
    gauge = await _setup(api)

    # LOOP THROUGH DUTY-CYCLES
    ui.print_header("MEASURE DUTY-CYCLES")
    for duty_cycle in GRIP_DUTY_CYCLES:
        # GRIP AND MEASURE FORCE
        for trial in range(NUM_DUTY_CYCLE_TRIALS):
            print(
                f"{duty_cycle}% duty cycle - trial {trial + 1}/{NUM_DUTY_CYCLE_TRIALS}"
            )
            actual_forces = await _grip_and_read_forces(api, gauge, duty=duty_cycle)
            print(actual_forces)
            avg_force = sum(actual_forces) / len(actual_forces)
            print(f"average = {round(avg_force, 2)} N")
            tag = _get_test_tag(trial, duty_cycle=duty_cycle)
            report(section, f"{tag}-data", actual_forces)
            report(section, f"{tag}-average", [avg_force])
            report(section, f"{tag}-duty-cycle", [duty_cycle])

    print("done")
    await api.retract(OT3Mount.GRIPPER)


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""
    gauge = await _setup(api)

    # LOOP THROUGH FORCES
    ui.print_header("MEASURE NEWTONS")
    for expected_force, allowed_percent_error in zip(
        GRIP_FORCES_NEWTON, FAILURE_THRESHOLD_PERCENTAGES
    ):
        for trial in range(NUM_NEWTONS_TRIALS):
            print(f"{expected_force}N - trial {trial + 1}/{NUM_NEWTONS_TRIALS}")
            actual_forces = await _grip_and_read_forces(
                api, gauge, force=expected_force
            )
            print(actual_forces)
            # base PASS/FAIL on average
            avg_force = sum(actual_forces) / len(actual_forces)
            print(f"average = {round(avg_force, 2)} N")
            error = (avg_force - expected_force) / expected_force
            result = CSVResult.from_bool(abs(error) * 100 < allowed_percent_error)
            # store all data in CSV
            tag = _get_test_tag(trial, newtons=expected_force)
            report(section, f"{tag}-data", actual_forces)
            report(section, f"{tag}-average", [avg_force])
            report(section, f"{tag}-target", [expected_force])
            report(section, f"{tag}-pass-%", [allowed_percent_error])
            report(section, f"{tag}-result", [result])

    print("done")
    await api.retract(OT3Mount.GRIPPER)
