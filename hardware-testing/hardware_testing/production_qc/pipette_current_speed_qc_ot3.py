"""Pipette Current/Speed Test."""
import argparse
import asyncio

from opentrons.hardware_control.ot3api import OT3API
from opentrons.config.defaults_ot3 import (
    DEFAULT_RUN_CURRENT,
    DEFAULT_MAX_SPEEDS,
    DEFAULT_ACCELERATIONS,
)
from opentrons_shared_data.errors.exceptions import StallOrCollisionDetectedError

from hardware_testing.data import get_git_description
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
    CSVSection,
    CSVLine,
)
from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.data import ui

TEST_TAG = "CURRENTS-SPEEDS"

DEFAULT_ACCELERATION = DEFAULT_ACCELERATIONS.low_throughput[types.OT3AxisKind.P]
DEFAULT_CURRENT = DEFAULT_RUN_CURRENT.low_throughput[types.OT3AxisKind.P]
DEFAULT_SPEED = DEFAULT_MAX_SPEEDS.low_throughput[types.OT3AxisKind.P]

MUST_PASS_CURRENT = DEFAULT_CURRENT * 0.6  # the target spec (must pass here)
STALL_THRESHOLD_MM = 0.1
TEST_SPEEDS = [DEFAULT_MAX_SPEEDS.low_throughput[types.OT3AxisKind.P]]
PLUNGER_CURRENTS_SPEED = {
    round(MUST_PASS_CURRENT - 0.3, 1): TEST_SPEEDS,
    round(MUST_PASS_CURRENT - 0.2, 1): TEST_SPEEDS,
    round(MUST_PASS_CURRENT - 0.1, 1): TEST_SPEEDS,
    round(MUST_PASS_CURRENT, 1): TEST_SPEEDS,
    DEFAULT_CURRENT: TEST_SPEEDS,
}
TEST_ACCELERATION = 1500  # used during gravimetric tests

MAX_CURRENT = max(max(list(PLUNGER_CURRENTS_SPEED.keys())), 1.0)
MAX_SPEED = max(TEST_SPEEDS)


def _get_test_tag(current: float, speed: float, direction: str, pos: str) -> str:
    return f"current-{current}-speed-{speed}-{direction}-{pos}"


def _build_csv_report() -> CSVReport:
    _report = CSVReport(
        test_name="pipette-current-speed-qc-ot3",
        sections=[
            CSVSection(
                title="OVERALL", lines=[CSVLine("failing-current", [float, CSVResult])]
            ),
            CSVSection(
                title=TEST_TAG,
                lines=[
                    CSVLine(
                        _get_test_tag(current, speed, direction, pos),
                        [float, float, float, float, CSVResult],
                    )
                    for current, speeds in PLUNGER_CURRENTS_SPEED.items()
                    for speed in speeds
                    for direction in ["down", "up"]
                    for pos in ["start", "end"]
                ],
            ),
        ],
    )
    return _report


async def _home_plunger(api: OT3API, mount: types.OT3Mount) -> None:
    # restore default current/speed before homing
    pipette_ax = types.Axis.of_main_tool_actuator(mount)
    await helpers_ot3.set_gantry_load_per_axis_current_settings_ot3(
        api, pipette_ax, run_current=DEFAULT_CURRENT
    )
    await helpers_ot3.set_gantry_load_per_axis_motion_settings_ot3(
        api, pipette_ax, default_max_speed=DEFAULT_SPEED
    )
    await api.home([pipette_ax])


async def _move_plunger(
    api: OT3API,
    mount: types.OT3Mount,
    p: float,
    s: float,
    c: float,
    a: float,
) -> None:
    # set max currents/speeds, to make sure we're not accidentally limiting ourselves
    pipette_ax = types.Axis.of_main_tool_actuator(mount)
    await helpers_ot3.set_gantry_load_per_axis_current_settings_ot3(
        api, pipette_ax, run_current=MAX_CURRENT
    )
    await helpers_ot3.set_gantry_load_per_axis_motion_settings_ot3(
        api,
        pipette_ax,
        default_max_speed=MAX_SPEED,
        acceleration=a,
    )
    # move
    await helpers_ot3.move_plunger_absolute_ot3(
        api, mount, p, speed=s, motor_current=c, expect_stalls=True
    )


async def _record_plunger_alignment(
    api: OT3API,
    mount: types.OT3Mount,
    report: CSVReport,
    current: float,
    speed: float,
    direction: str,
    position: str,
) -> bool:
    pipette_ax = types.Axis.of_main_tool_actuator(mount)
    _current_pos = await api.current_position_ot3(mount)
    est = _current_pos[pipette_ax]
    if not api.is_simulator:
        _encoder_poses = await api.encoder_current_position_ot3(mount)
        enc = _encoder_poses[pipette_ax]
    else:
        enc = est
    _stalled_mm = est - enc
    print(f"{position}: motor={est}, encoder={enc}")
    _did_pass = abs(_stalled_mm) < STALL_THRESHOLD_MM
    _tag = _get_test_tag(current, speed, direction, position)
    report(
        TEST_TAG,
        _tag,
        [current, speed, est, enc, CSVResult.from_bool(_did_pass)],
    )
    return _did_pass


async def _test_direction(
    api: OT3API,
    mount: types.OT3Mount,
    report: CSVReport,
    current: float,
    speed: float,
    acceleration: float,
    direction: str,
) -> bool:
    plunger_poses = helpers_ot3.get_plunger_positions_ot3(api, mount)
    top, bottom, blowout, drop_tip = plunger_poses
    # check that encoder/motor align
    aligned = await _record_plunger_alignment(
        api, mount, report, current, speed, direction, "start"
    )
    if not aligned:
        return False
    # move the plunger
    _plunger_target = {"down": blowout, "up": top}[direction]
    try:
        await _move_plunger(api, mount, _plunger_target, speed, current, acceleration)
        # check that encoder/motor still align
        aligned = await _record_plunger_alignment(
            api, mount, report, current, speed, direction, "end"
        )
    except StallOrCollisionDetectedError as e:
        print(e)
        aligned = False
        await _home_plunger(api, mount)
    return aligned


async def _unstick_plunger(api: OT3API, mount: types.OT3Mount) -> None:
    plunger_poses = helpers_ot3.get_plunger_positions_ot3(api, mount)
    top, bottom, blowout, drop_tip = plunger_poses
    await _move_plunger(api, mount, bottom, 10, 1.0, DEFAULT_ACCELERATION)
    await _home_plunger(api, mount)


async def _test_plunger(api: OT3API, mount: types.OT3Mount, report: CSVReport) -> float:
    ui.print_header("UNSTICK PLUNGER")
    await _unstick_plunger(api, mount)
    # start at HIGHEST (easiest) current
    currents = sorted(list(PLUNGER_CURRENTS_SPEED.keys()), reverse=True)
    for current in currents:
        # start at LOWEST (easiest) speed
        speeds = sorted(PLUNGER_CURRENTS_SPEED[current], reverse=False)
        for speed in speeds:
            ui.print_header(f"CURRENT = {current}; SPEED = {speed}")
            await _home_plunger(api, mount)
            for direction in ["down", "up"]:
                _pass = await _test_direction(
                    api, mount, report, current, speed, TEST_ACCELERATION, direction
                )
                if not _pass:
                    ui.print_error(
                        f"failed moving {direction} at {current} amps and {speed} mm/sec"
                    )
                    return current
    return 0.0


async def _get_next_pipette_mount(api: OT3API) -> types.OT3Mount:
    if not api.is_simulator:
        ui.get_user_ready("attach a pipette")
    await helpers_ot3.update_firmware(api)
    await api.cache_instruments()
    found = [
        types.OT3Mount.from_mount(m) for m, p in api.hardware_pipettes.items() if p
    ]
    if not found:
        return await _get_next_pipette_mount(api)
    return found[0]


async def _reset_gantry(api: OT3API) -> None:
    await api.home()
    home_pos = await api.gantry_position(
        types.OT3Mount.RIGHT, types.CriticalPoint.MOUNT
    )
    test_pos = helpers_ot3.get_slot_calibration_square_position_ot3(5)
    test_pos = test_pos._replace(z=home_pos.z)
    await api.move_to(
        types.OT3Mount.RIGHT, test_pos, critical_point=types.CriticalPoint.MOUNT
    )


async def _main(is_simulating: bool) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=is_simulating,
        pipette_left="p1000_single_v3.4",
        pipette_right="p1000_multi_v3.4",
    )
    if not api.is_simulator:
        operator = input("enter OPERATOR name: ")
    else:
        operator = "simulation"
    # home and move to a safe position
    await _reset_gantry(api)

    # test each attached pipette
    while True:
        mount = await _get_next_pipette_mount(api)
        pipette = api.hardware_pipettes[mount.to_mount()]
        assert pipette
        pipette_sn = helpers_ot3.get_pipette_serial_ot3(pipette)
        ui.print_title(f"{pipette_sn} - {mount.name}")
        if not api.is_simulator and not ui.get_user_answer("QC this pipette"):
            continue
        report = _build_csv_report()
        report.set_version(get_git_description())
        report.set_operator(operator)
        report.set_robot_id(helpers_ot3.get_robot_serial_ot3(api))
        report.set_tag(pipette_sn)
        if not api.is_simulator:
            barcode = input("scan pipette barcode: ")
        else:
            barcode = str(pipette_sn)
        report.set_device_id(pipette_sn, CSVResult.from_bool(barcode == pipette_sn))
        failing_current = await _test_plunger(api, mount, report)
        report(
            "OVERALL",
            "failing-current",
            [failing_current, CSVResult.from_bool(failing_current < MUST_PASS_CURRENT)],
        )
        if api.is_simulator:
            break


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    args = parser.parse_args()
    asyncio.run(_main(args.simulate))
