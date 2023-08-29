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

from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
    CSVSection,
    CSVLine,
)
from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.data import ui

DEFAULT_TRIALS = 5
STALL_THRESHOLD_MM = 0.1
TEST_ACCELERATION = 1500  # used during gravimetric tests

DEFAULT_ACCELERATION = DEFAULT_ACCELERATIONS.low_throughput[types.OT3AxisKind.P]
DEFAULT_CURRENT = DEFAULT_RUN_CURRENT.low_throughput[types.OT3AxisKind.P]
DEFAULT_SPEED = DEFAULT_MAX_SPEEDS.low_throughput[types.OT3AxisKind.P]

MUST_PASS_CURRENT = round(DEFAULT_CURRENT * 0.75, 2)  # the target spec (must pass here)
assert (
    MUST_PASS_CURRENT < DEFAULT_CURRENT
), "must-pass current must be less than default current"
TEST_SPEEDS = [
    DEFAULT_MAX_SPEEDS.low_throughput[types.OT3AxisKind.P] - 20,
    DEFAULT_MAX_SPEEDS.low_throughput[types.OT3AxisKind.P],
    DEFAULT_MAX_SPEEDS.low_throughput[types.OT3AxisKind.P] + 10,
    DEFAULT_MAX_SPEEDS.low_throughput[types.OT3AxisKind.P] + 20,
]
PLUNGER_CURRENTS_SPEED = {
    MUST_PASS_CURRENT - 0.45: TEST_SPEEDS,
    MUST_PASS_CURRENT - 0.35: TEST_SPEEDS,
    MUST_PASS_CURRENT - 0.25: TEST_SPEEDS,
    MUST_PASS_CURRENT: TEST_SPEEDS,
    DEFAULT_CURRENT: TEST_SPEEDS,
}

MAX_SPEED = max(TEST_SPEEDS)
MAX_CURRENT = max(max(list(PLUNGER_CURRENTS_SPEED.keys())), 1.0)
assert MAX_CURRENT == DEFAULT_CURRENT, (
    f"do not test current ({MAX_CURRENT}) "
    f"above the software's default current ({DEFAULT_CURRENT})"
)


def _get_test_tag(
    current: float, speed: float, trial: int, direction: str, pos: str
) -> str:
    return f"current-{current}-speed-trial-{trial}-{speed}-{direction}-{pos}"


def _get_section_tag(current: float) -> str:
    return f"CURRENT-{current}-AMPS"


def _includes_result(current: float, speed: float) -> bool:
    return current >= MUST_PASS_CURRENT


def _build_csv_report(trials: int) -> CSVReport:
    _report = CSVReport(
        test_name="pipette-current-speed-qc-ot3",
        sections=[
            CSVSection(
                title=_get_section_tag(current),
                lines=[
                    CSVLine(
                        _get_test_tag(current, speed, trial, direction, pos),
                        [float, float, float, float, CSVResult]
                        if _includes_result(current, speed)
                        else [float, float, float, float],
                    )
                    for speed in sorted(PLUNGER_CURRENTS_SPEED[current], reverse=False)
                    for trial in range(trials)
                    for direction in ["down", "up"]
                    for pos in ["start", "end"]
                ],
            )
            for current in sorted(list(PLUNGER_CURRENTS_SPEED.keys()), reverse=False)
        ],
    )
    return _report


async def _home_plunger(api: OT3API, mount: types.OT3Mount) -> None:
    # restore default current/speed before homing
    pipette_ax = types.Axis.of_main_tool_actuator(mount)
    await helpers_ot3.set_gantry_load_per_axis_current_settings_ot3(
        api, pipette_ax, run_current=1.0
    )
    await helpers_ot3.set_gantry_load_per_axis_motion_settings_ot3(
        api,
        pipette_ax,
        default_max_speed=DEFAULT_SPEED / 2,
        acceleration=DEFAULT_ACCELERATION,
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
        api, pipette_ax, run_current=c
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
    trial: int,
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
    print(f"{position}: motor={round(est, 2)}, encoder={round(enc, 2)}")
    _did_pass = abs(_stalled_mm) < STALL_THRESHOLD_MM
    # NOTE: only tests that are required to PASS need to show a results in the file
    data = [round(current, 2), round(speed, 2), round(est, 2), round(enc, 2)]
    if _includes_result(current, speed):
        data.append(CSVResult.from_bool(_did_pass))  # type: ignore[arg-type]
    report(
        _get_section_tag(current),
        _get_test_tag(current, speed, trial, direction, position),
        data,
    )
    return _did_pass


async def _test_direction(
    api: OT3API,
    mount: types.OT3Mount,
    report: CSVReport,
    trial: int,
    current: float,
    speed: float,
    acceleration: float,
    direction: str,
) -> bool:
    plunger_poses = helpers_ot3.get_plunger_positions_ot3(api, mount)
    top, _, bottom, _ = plunger_poses
    # check that encoder/motor align
    aligned = await _record_plunger_alignment(
        api, mount, report, trial, current, speed, direction, "start"
    )
    if not aligned:
        print("ERROR: unable to align at the start")
        return False
    # move the plunger
    _plunger_target = {"down": bottom, "up": top + 1.0}[direction]
    try:
        await _move_plunger(api, mount, _plunger_target, speed, current, acceleration)
        # check that encoder/motor still align
        aligned = await _record_plunger_alignment(
            api, mount, report, trial, current, speed, direction, "end"
        )
    except StallOrCollisionDetectedError as e:
        print(e)
        aligned = False
        await _home_plunger(api, mount)
    return aligned


async def _test_plunger(
    api: OT3API,
    mount: types.OT3Mount,
    report: CSVReport,
    trials: int,
    continue_after_stall: bool,
) -> float:
    # start at HIGHEST (easiest) current
    currents = sorted(list(PLUNGER_CURRENTS_SPEED.keys()), reverse=False)
    max_failed_current = 0.0
    for current in currents:
        ui.print_title(f"CURRENT = {current}")
        # start at LOWEST (easiest) speed
        speeds = sorted(PLUNGER_CURRENTS_SPEED[current], reverse=False)
        for speed in speeds:
            for trial in range(trials):
                ui.print_header(
                    f"CURRENT = {current}: "
                    f"SPEED = {speed}: "
                    f"TRIAL = {trial + 1}/{trials}"
                )
                await _home_plunger(api, mount)
                for direction in ["down", "up"]:
                    _pass = await _test_direction(
                        api,
                        mount,
                        report,
                        trial,
                        current,
                        speed,
                        TEST_ACCELERATION,
                        direction,
                    )
                    if not _pass:
                        ui.print_error(
                            f"failed moving {direction} at {current} amps and {speed} mm/sec"
                        )
                        max_failed_current = max(max_failed_current, current)
                        if continue_after_stall:
                            break
                        else:
                            return max_failed_current
    return max_failed_current


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
    await api.home(
        [
            types.Axis.Z_L,
            types.Axis.Z_R,
            types.Axis.X,
            types.Axis.Y,
        ]
    )
    home_pos = await api.gantry_position(
        types.OT3Mount.RIGHT, types.CriticalPoint.MOUNT
    )
    test_pos = helpers_ot3.get_slot_calibration_square_position_ot3(5)
    test_pos = test_pos._replace(z=home_pos.z)
    await api.move_to(
        types.OT3Mount.RIGHT, test_pos, critical_point=types.CriticalPoint.MOUNT
    )


async def _main(is_simulating: bool, trials: int, continue_after_stall: bool) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=is_simulating,
        pipette_left="p1000_single_v3.4",
        pipette_right="p1000_multi_v3.4",
    )
    # home and move to a safe position
    await _reset_gantry(api)

    # test each attached pipette
    while True:
        mount = await _get_next_pipette_mount(api)
        if not api.is_simulator and not ui.get_user_answer(f"QC {mount.name} pipette"):
            continue

        report = _build_csv_report(trials=trials)
        dut = helpers_ot3.DeviceUnderTest.by_mount(mount)
        helpers_ot3.set_csv_report_meta_data_ot3(api, report, dut)

        await _test_plunger(
            api, mount, report, trials=trials, continue_after_stall=continue_after_stall
        )
        ui.print_title("DONE")
        report.save_to_disk()
        report.print_results()
        if api.is_simulator:
            break


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--trials", type=int, default=DEFAULT_TRIALS)
    parser.add_argument("--continue-after-stall", action="store_true")
    args = parser.parse_args()
    asyncio.run(_main(args.simulate, args.trials, args.continue_after_stall))
