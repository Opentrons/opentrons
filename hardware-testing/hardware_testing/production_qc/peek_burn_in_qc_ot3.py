"""PEEK Pipette Burn In Test."""
import argparse
import asyncio

from opentrons.hardware_control.ot3api import OT3API
from opentrons.config.defaults_ot3 import (
    DEFAULT_RUN_CURRENT,
    DEFAULT_MAX_SPEEDS,
    DEFAULT_ACCELERATIONS,
)
from opentrons_shared_data.errors.exceptions import StallOrCollisionDetectedError

from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    FirmwareUpdateInitiate,
    FirmwareUpdateStartApp,
)
from opentrons.hardware_control.backends.ot3utils import sensor_node_for_mount

from pathlib import Path
from typing import Callable, List, Optional

from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
    CSVSection,
    CSVLine,
    META_DATA_TITLE,
    META_DATA_TEST_TAG,
    RESULTS_OVERVIEW_TITLE,
)
from hardware_testing.data import (
    create_run_id,
    create_folder_for_test_data,
    get_git_description,
)
from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.data import ui

DEFAULT_TRIALS = 10 # The number of trials each current speed check does
DEFAULT_CYCLES = 40 # The number of burn-in cycles
TRIALS_PER_CYCLE = 500 # number of plunger cycles in one burn in cycle

STALL_THRESHOLD_MM = 0.1
TEST_ACCELERATION = 1500  # used during gravimetric tests

CYCLING_CURRENT = 1
CYCLING_SPEED = 90

DEFAULT_ACCELERATION = DEFAULT_ACCELERATIONS.low_throughput[types.OT3AxisKind.P]
DEFAULT_CURRENT = DEFAULT_RUN_CURRENT.low_throughput[types.OT3AxisKind.P]
DEFAULT_SPEED = DEFAULT_MAX_SPEEDS.low_throughput[types.OT3AxisKind.P]

MUST_PASS_CURRENT = 0.4  # the target spec (must pass here)
assert (
    MUST_PASS_CURRENT < DEFAULT_CURRENT
), "must-pass current must be less than default current"

TEST_SPEEDS = [
    90,
    80,
    70,
    60
]

# TEST_SPEEDS = [80, 70]

PLUNGER_CURRENTS_SPEED = {
    # 0.3: TEST_SPEEDS,
    # 0.35: TEST_SPEEDS,
    0.4: TEST_SPEEDS,
    0.45: TEST_SPEEDS,
    0.5: TEST_SPEEDS,
    0.55: TEST_SPEEDS,
    0.6: TEST_SPEEDS,
    1: TEST_SPEEDS,
}


MAX_SPEED = max(TEST_SPEEDS)
MAX_CURRENT = max(max(list(PLUNGER_CURRENTS_SPEED.keys())), 1.0)
assert MAX_CURRENT == DEFAULT_CURRENT, (
    f"do not test current ({MAX_CURRENT}) "
    f"above the software's default current ({DEFAULT_CURRENT})"
)


def _get_test_tag(
    cycle: int, current: float, speed: float, trial: int, direction: str, pos: str
) -> str:
    return f"cycle-{cycle}-current-{current}-speed-{speed}-trial-{trial}-{direction}-{pos}"


def _get_section_tag(cycle: int, current: float) -> str:
    return f"CYCLE-{cycle}-CURRENT-{current}-AMPS"


def _get_cycling_test_tag(cycle: int) -> str:
    return f"cycle-{cycle}"


def _get_cycling_section_tag() -> str:
    return f"CYCLING-RESULTS"


def _includes_result(current: float, speed: float) -> bool:
    return current >= MUST_PASS_CURRENT


# summary section title
SUMMARY_SECTION_TITLE = "SUMMARY_RESULTS"

# summary results tags
BURN_IN_TEST_RESULTS = "BURN_IN_TEST_RESULTS"
TEST_PLUNGER_RESULTS = "TEST_PLUNGER_RESULTS"
CYCLE_PLUNGER_RESULTS = "CYCLE_PLUNGER_RESULTS"
TEST_PLUNGER_FAIL_REASON = "TEST_PLUNGER_FAIL_REASON"
CYCLE_PLUNGER_REASON = "CYCLE_PLUNGER_REASON"

PEEK_BURN_IN_TEST_NAME = "peek-burn-in"


def _get_run_output_paths(
    run_id: str, sn: str, mount: types.OT3Mount
) -> tuple[Path, Path]:
    """Return results/recorder paths under testing_data/peek-burn-in/{run_id}/."""
    test_folder = create_folder_for_test_data(PEEK_BURN_IN_TEST_NAME)
    run_folder = create_folder_for_test_data(test_folder / run_id)
    mount_tag = mount.name.lower()
    results_path = run_folder / f"{PEEK_BURN_IN_TEST_NAME}_{sn}_{mount_tag}-results.csv"
    recorder_path = run_folder / f"{PEEK_BURN_IN_TEST_NAME}_{sn}_{mount_tag}-recorder.csv"
    return results_path, recorder_path


def _build_results_report(cycles: int, trials: int, run_id: str) -> CSVReport:
    """Build results report containing summary data: META_DATA, RESULTS_OVERVIEW, CYCLING-RESULTS, SUMMARY_RESULTS"""
    # Results report only contains summary sections
    section_list = [
        CSVSection(
            title=_get_cycling_section_tag(),
            lines=[
                CSVLine(_get_cycling_test_tag(cycle), [int, CSVResult])
                for cycle in range(0, (cycles+1)*TRIALS_PER_CYCLE, TRIALS_PER_CYCLE)
            ],
        ),
        CSVSection(
            title=SUMMARY_SECTION_TITLE,
            lines=[
                CSVLine(BURN_IN_TEST_RESULTS, [str]),
                CSVLine(TEST_PLUNGER_RESULTS, [str]),
                CSVLine(CYCLE_PLUNGER_RESULTS, [str]),
                CSVLine(TEST_PLUNGER_FAIL_REASON, [str]),
                CSVLine(CYCLE_PLUNGER_REASON, [str]),
            ],
        ),
    ]
    _report = CSVReport(
        test_name="peek-burn-in-qc-ot3-results",
        sections=section_list,
        run_id=run_id,
    )
    _configure_peek_results_overview(_report)
    return _report


def _peek_results_overview_section(section_titles: List[str]) -> CSVSection:
    return CSVSection(
        title=RESULTS_OVERVIEW_TITLE,
        lines=[
            CSVLine(tag=f"RESULT_{title}", data=[CSVResult])
            for title in section_titles
        ],
    )


def _configure_peek_results_overview(report: CSVReport) -> None:
    """RESULTS_OVERVIEW: only META_DATA + SUMMARY_RESULTS (no CYCLING-RESULTS)."""
    peek_overview = _peek_results_overview_section(
        [META_DATA_TITLE, SUMMARY_SECTION_TITLE]
    )
    for i, section in enumerate(report._sections):
        if section.title == RESULTS_OVERVIEW_TITLE:
            report._sections[i] = peek_overview
            break

    # New overview lines need the same start time as the rest of the report.
    start_time = report[META_DATA_TITLE].lines[0]._start_time
    assert start_time, "META_DATA lines must be initialized before overview setup"
    for line in peek_overview.lines:
        line.cache_start_time(start_time)

    def _peek_refresh_results_overview() -> None:
        results_section = report[RESULTS_OVERVIEW_TITLE]
        meta_section = report[META_DATA_TITLE]
        line = results_section[f"RESULT_{META_DATA_TITLE}"]
        assert isinstance(line, CSVLine)
        if meta_section.result_passed:
            line.store(CSVResult.PASS, print_results=False)
        elif meta_section.result_passed is False:
            line.store(CSVResult.FAIL, print_results=False)
        else:
            line.store(None, print_results=False)

    report._refresh_results_overview_values = _peek_refresh_results_overview  # type: ignore[method-assign]


def _set_peek_summary_results_overview(
    results_report: CSVReport, burn_in_result: str
) -> None:
    """RESULT_SUMMARY_RESULTS: PASS if BURN_IN_TEST_RESULTS and META_DATA both pass."""
    meta_passed = results_report[META_DATA_TITLE].result_passed is True
    summary_passed = burn_in_result == "PASS" and meta_passed
    line = results_report[RESULTS_OVERVIEW_TITLE][f"RESULT_{SUMMARY_SECTION_TITLE}"]
    assert isinstance(line, CSVLine)
    line.store(
        CSVResult.PASS if summary_passed else CSVResult.FAIL,
        print_results=False,
    )


def _save_report_to_path(report: CSVReport, path: Path) -> None:
    """Write report CSV to a fixed path (overwrites each call)."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        f.write(str(report) + "\n")


def _write_summary_and_save_results(
    results_report: CSVReport,
    results_path: Path,
    *,
    test_plunger_passed: bool,
    cycle_plunger_passed: bool,
    test_plunger_fail_reasons: List[str],
    cycle_plunger_stall_reasons: List[str],
) -> None:
    """Write SUMMARY_RESULTS / overview and save results CSV."""
    burn_in_passed = test_plunger_passed and cycle_plunger_passed
    test_plunger_result = "PASS" if test_plunger_passed else "FAIL"
    cycle_plunger_result = "PASS" if cycle_plunger_passed else "FAIL"
    burn_in_result = "PASS" if burn_in_passed else "FAIL"
    test_plunger_fail_str = (
        "; ".join(test_plunger_fail_reasons) if test_plunger_fail_reasons else "N/A"
    )
    cycle_plunger_stall_str = (
        "; ".join(cycle_plunger_stall_reasons) if cycle_plunger_stall_reasons else "N/A"
    )
    results_report(SUMMARY_SECTION_TITLE, BURN_IN_TEST_RESULTS, [burn_in_result])
    results_report(SUMMARY_SECTION_TITLE, TEST_PLUNGER_RESULTS, [test_plunger_result])
    results_report(SUMMARY_SECTION_TITLE, CYCLE_PLUNGER_RESULTS, [cycle_plunger_result])
    results_report(SUMMARY_SECTION_TITLE, TEST_PLUNGER_FAIL_REASON, [test_plunger_fail_str])
    results_report(SUMMARY_SECTION_TITLE, CYCLE_PLUNGER_REASON, [cycle_plunger_stall_str])
    _set_peek_summary_results_overview(results_report, burn_in_result)
    _save_report_to_path(results_report, results_path)
    print(f"Results report saved to: {results_path}")


def _set_csv_report_meta_data_no_save(
    api: OT3API,
    report: CSVReport,
    dut: helpers_ot3.DeviceUnderTest,
    meta_tag: str,
) -> None:
    """Set CSVReport meta-data without set_tag(), which would auto-save to disk."""
    report.set_operator("operator")
    robot_serial = helpers_ot3.get_robot_serial_ot3(api)
    dut_str = helpers_ot3._get_serial_for_dut(api, dut)
    print(f"device under test: {dut_str}")
    barcode = dut_str
    print(f"barcode: {barcode}")
    report(META_DATA_TITLE, META_DATA_TEST_TAG, [meta_tag])
    report.set_device_id(dut_str, barcode)
    report.set_robot_id(robot_serial)
    report.set_firmware(api.fw_version)
    report.set_version(get_git_description())


def _build_recorder_report(cycles: int, trials: int, run_id: str) -> CSVReport:
    """Build recorder report containing detailed test data: test plunger and cycle plunger records"""
    # Recorder report only contains detailed test sections
    section_list = [
        CSVSection(
            title=_get_section_tag(cycle, current),
            lines=[
                CSVLine(
                    _get_test_tag(cycle, current, speed, trial, direction, pos),
                    [float, float, float, float, bool, CSVResult]
                    if _includes_result(current, speed)
                    else [float, float, float, float, bool],
                )
                for speed in sorted(PLUNGER_CURRENTS_SPEED[current], reverse=False)
                for trial in range(trials)
                for direction in ["down", "up"]
                for pos in ["start", "end"]
            ],
        )
        for cycle in range(0, (cycles+1)*TRIALS_PER_CYCLE, TRIALS_PER_CYCLE)
        for current in sorted(list(PLUNGER_CURRENTS_SPEED.keys()), reverse=False)
    ]
    _report = CSVReport(test_name="peek-burn-in-qc-ot3-recorder", sections=section_list, run_id=run_id)
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


async def _reset_pipette_fw(api: OT3API, mount: types.OT3Mount) -> None:
    if not api.is_simulator:
        turn_off = FirmwareUpdateInitiate()
        turn_on = FirmwareUpdateStartApp()
        pip_node = sensor_node_for_mount(mount)
        await api._backend._messenger.ensure_send(pip_node, turn_off)
        await asyncio.sleep(1)
        await api._backend._messenger.ensure_send(pip_node.bootloader_for(), turn_on)
        await _home_plunger(api, mount)


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
    cycle: int,
    trial: int,
    current: float,
    speed: float,
    direction: str,
    position: str,
    on_recorded: Optional[Callable[[], None]] = None,
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
    data = [round(current, 2), round(speed, 2),
            round(est, 2), round(enc, 2),
            _did_pass]
    if _includes_result(current, speed):
        data.append(CSVResult.from_bool(_did_pass))  # type: ignore[arg-type]
    report(
        _get_section_tag(cycle, current),
        _get_test_tag(cycle, current, speed, trial, direction, position),
        data,
    )
    if on_recorded is not None:
        on_recorded()
    return _did_pass


async def _test_direction(
    api: OT3API,
    mount: types.OT3Mount,
    report: CSVReport,
    cycle: int,
    trial: int,
    current: float,
    speed: float,
    acceleration: float,
    direction: str,
    on_recorded: Optional[Callable[[], None]] = None,
) -> bool:
    plunger_poses = helpers_ot3.get_plunger_positions_ot3(api, mount)
    top, _, bottom, _ = plunger_poses
    # check that encoder/motor align
    aligned = await _record_plunger_alignment(
        api, mount, report, cycle, trial, current, speed, direction, "start",
        on_recorded=on_recorded,
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
            api, mount, report, cycle, trial, current, speed, direction, "end",
            on_recorded=on_recorded,
        )
    except StallOrCollisionDetectedError as e:
        print(e)
        aligned = False
        await _home_plunger(api, mount)
    return aligned


async def _move_plunger_as_cycle_settings(api: OT3API,
    mount: types.OT3Mount) -> None:
    ui.print_header("Move plunger as "
                    f"CURRENT = {CYCLING_CURRENT}: "
                    f"SPEED = {CYCLING_SPEED}: "
                )
    await _home_plunger(api, mount)
    plunger_poses = helpers_ot3.get_plunger_positions_ot3(api, mount)
    top, _, bottom, _ = plunger_poses
    for direction in ["down", "up"]:
        # move the plunger
        _plunger_target = {"down": bottom, "up": top + 1.0}[direction]
        try:
            await _move_plunger(api, mount, _plunger_target, CYCLING_SPEED, CYCLING_CURRENT, TEST_ACCELERATION)
        except StallOrCollisionDetectedError as e:
            print(e)
            await _home_plunger(api, mount)

# Test Plunger Threshold
STOP_TEST_CURRENT_THRESHOLD = 0.55  # If current >= 0.55A failed, stop burn-in and record fail_reason

async def _test_plunger(
    api: OT3API,
    mount: types.OT3Mount,
    report: CSVReport,
    cycle: int,
    trials: int,
    continue_after_stall: bool,
    on_recorded: Optional[Callable[[], None]] = None,
) -> tuple[float, str, bool, bool]:
    """Return (max_failed_current, fail_reason, had_failure, stop_burn_in).

    fail_reason is only set when current >= STOP_TEST_CURRENT_THRESHOLD.
    stop_burn_in is True only for that case (entire burn-in must stop).
    """
    # start at lowest current
    currents = sorted(list(PLUNGER_CURRENTS_SPEED.keys()), reverse=False)
    max_failed_current = 0.0
    fail_reasons: List[str] = []
    had_failure = False
    for current in currents:
        ui.print_title(f"CURRENT = {current}")
        # start at LOWEST (easiest) speed
        speeds = sorted(PLUNGER_CURRENTS_SPEED[current], reverse=False)
        for speed in speeds:
            for trial in range(trials):
                ui.print_header(
                    f"CURRENT = {current}: "
                    f"SPEED = {speed}: "
                    f"TRIAL = {trial + 1}/{trials}: "
                    f"CYCLE = {cycle}"
                )
                await _home_plunger(api, mount)
                for direction in ["down", "up"]:
                    _pass = await _test_direction(
                        api,
                        mount,
                        report,
                        cycle,
                        trial,
                        current,
                        speed,
                        TEST_ACCELERATION,
                        direction,
                        on_recorded=on_recorded,
                    )
                    if not _pass:
                        ui.print_error(
                            f"failed moving {direction} at {current} amps and {speed} mm/sec"
                        )
                        max_failed_current = max(max_failed_current, current)
                        if current >= STOP_TEST_CURRENT_THRESHOLD:
                            had_failure = True
                            fail_reasons.append(f"current-{current}A&speed-{speed}")
                            ui.print_error(
                                f"FAILED at current >= {STOP_TEST_CURRENT_THRESHOLD}A, stopping burn-in"
                            )
                            return (
                                max_failed_current,
                                "; ".join(fail_reasons),
                                True,
                                True,
                            )
                        if continue_after_stall:
                            break
                        else:
                            return max_failed_current, "", True, False
    return max_failed_current, "", had_failure, False


async def _record_plunger_alignment_cycle(
    api: OT3API,
    mount: types.OT3Mount,
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

    return _did_pass


async def _test_direction_cycle(
    api: OT3API,
    mount: types.OT3Mount,
    current: float,
    speed: float,
    acceleration: float,
    direction: str,
) -> bool:
    plunger_poses = helpers_ot3.get_plunger_positions_ot3(api, mount)
    top, _, bottom, _ = plunger_poses
    # check that encoder/motor align
    aligned = await _record_plunger_alignment_cycle(
        api, mount, current, speed, direction, "start"
    )
    if not aligned:
        print("ERROR: unable to align at the start")
        return False
    # move the plunger
    _plunger_target = {"down": bottom, "up": top + 1.0}[direction]
    try:
        await _move_plunger(api, mount, _plunger_target, speed, current, acceleration)
        # check that encoder/motor still align
        aligned = await _record_plunger_alignment_cycle(
            api, mount, current, speed, direction, "end"
        )
    except StallOrCollisionDetectedError as e:
        print(e)
        aligned = False
        await _home_plunger(api, mount)
    return aligned


async def _cycle_plunger(
    api: OT3API,
    mount: types.OT3Mount,
    cycle: int,
    trials: int,
    continue_after_stall: bool,
) -> tuple:
    """Cycle the plunger at the set current and speed. Return number of failed cycles and stall reason"""

    failed_cycles = 0
    stall_reasons = []

    for trial in range(trials):
        ui.print_header(
            f"CURRENT = {CYCLING_CURRENT}: "
            f"SPEED = {CYCLING_SPEED}: "
            f"TRIAL = {trial + 1}/{trials}: "
            f"CYCLE = {cycle}"
        )
        await _home_plunger(api, mount)
        for direction in ["down", "up"]:
            _pass = await _test_direction_cycle(
                api,
                mount,
                CYCLING_CURRENT,
                CYCLING_SPEED,
                TEST_ACCELERATION,
                direction,
            )
            if not _pass:
                ui.print_error(
                    f"failed moving {direction} at {CYCLING_CURRENT} amps and {CYCLING_SPEED} mm/sec"
                )
                failed_cycles = failed_cycles + 1
                stall_reasons.append(f"cycle{cycle}-{trial}")
                ui.print_error(
                    f"-----failed at {trial} cycles and {failed_cycles} failed cycles"
                )
                # If a stall, stop test immediately
                ui.print_error("STALL detected during cycling, stopping test immediately")
                return failed_cycles, "; ".join(stall_reasons)

    return failed_cycles, "; ".join(stall_reasons)


async def _get_next_pipette_mount(api: OT3API) -> List[types.OT3Mount]:
    # if not api.is_simulator:
    #     ui.get_user_ready("attach a pipette")
    await helpers_ot3.update_firmware(api)
    await api.cache_instruments()
    found = [
        types.OT3Mount.from_mount(m) for m, p in api.hardware_pipettes.items() if p
    ]
    if not found:
        return await _get_next_pipette_mount(api)

    return found # pass entire list to allow pipette on either mount


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


def _dry_run_reports(cycles: int, trials: int) -> None:
    """Build and save sample reports without hardware (smoke test)."""
    run_id = create_run_id()
    sn = "DRY-RUN-SN"
    mount = types.OT3Mount.LEFT
    results_report = _build_results_report(cycles=cycles, trials=trials, run_id=run_id)
    recorder_report = _build_recorder_report(cycles=cycles, trials=trials, run_id=run_id)
    results_report._test_name = PEEK_BURN_IN_TEST_NAME
    recorder_report._test_name = PEEK_BURN_IN_TEST_NAME
    results_report(META_DATA_TITLE, META_DATA_TEST_TAG, [f"{sn}-results"])
    results_report(META_DATA_TITLE, META_DATA_TEST_DEVICE_ID, ["DRY", "DRY", CSVResult.PASS])
    results_report(
        _get_cycling_section_tag(),
        _get_cycling_test_tag(0),
        [0, CSVResult.PASS],
    )
    results_report(SUMMARY_SECTION_TITLE, BURN_IN_TEST_RESULTS, ["PASS"])
    results_report(SUMMARY_SECTION_TITLE, TEST_PLUNGER_RESULTS, ["PASS"])
    results_report(SUMMARY_SECTION_TITLE, CYCLE_PLUNGER_RESULTS, ["PASS"])
    results_report(SUMMARY_SECTION_TITLE, TEST_PLUNGER_FAIL_REASON, ["N/A"])
    results_report(SUMMARY_SECTION_TITLE, CYCLE_PLUNGER_REASON, ["N/A"])
    _set_peek_summary_results_overview(results_report, "PASS")
    results_path, recorder_path = _get_run_output_paths(run_id, sn, mount)
    _save_report_to_path(results_report, results_path)
    _save_report_to_path(recorder_report, recorder_path)
    overview = results_report[RESULTS_OVERVIEW_TITLE]
    assert "RESULT_CYCLING-RESULTS" not in [ln.tag for ln in overview.lines]
    assert "RESULT_META_DATA" in [ln.tag for ln in overview.lines]
    assert "RESULT_SUMMARY_RESULTS" in [ln.tag for ln in overview.lines]
    print(f"Dry-run OK: {results_path}")
    print(f"Dry-run OK: {recorder_path}")


async def _main(is_simulating: bool, cycles: int, trials: int, continue_after_stall: bool) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=is_simulating,
        pipette_left="p1000_multi_v3.4",
        pipette_right="p1000_multi_v3.4",
    )
    # home and move to a safe position
    await _reset_gantry(api)

    # test each attached pipette
    mount_list = await _get_next_pipette_mount(api)

    for mount in mount_list:
            # if not api.is_simulator and not ui.get_user_answer(f"QC {mount.name} pipette"):
            #     continue

            # Create shared run_id for both reports
            run_id = create_run_id()

            dut = helpers_ot3.DeviceUnderTest.by_mount(mount)
            dut_str = str(dut)
            sn = helpers_ot3._get_serial_for_dut(api, dut)

            results_report = _build_results_report(cycles=cycles, trials=trials, run_id=run_id)
            recorder_report = _build_recorder_report(cycles=cycles, trials=trials, run_id=run_id)

            results_report._test_name = PEEK_BURN_IN_TEST_NAME
            recorder_report._test_name = PEEK_BURN_IN_TEST_NAME

            # Set meta data on both reports (do not use set_csv_report_meta_data_ot3:
            # it calls set_tag() which auto-saves a single CSV via save_to_disk())
            _set_csv_report_meta_data_no_save(
                api, results_report, dut, meta_tag=f"{sn}-results"
            )
            _set_csv_report_meta_data_no_save(
                api, recorder_report, dut, meta_tag=f"{sn}-recorder"
            )

            results_path, recorder_path = _get_run_output_paths(run_id, sn, mount)

            def _save_recorder() -> None:
                _save_report_to_path(recorder_report, recorder_path)

            # Initial recorder file so data exists from test start
            _save_recorder()
            print(f"Run folder: {recorder_path.parent}")
            print(f"Recorder report (incremental): {recorder_path}")

            # Track test results for summary
            test_plunger_fail_reasons = []
            cycle_plunger_stall_reasons = []
            test_plunger_passed = True
            cycle_plunger_passed = True

            stop_burn_in = False
            for cycle in range(0, cycles * TRIALS_PER_CYCLE, TRIALS_PER_CYCLE):
                _max_failed, fail_reason, had_failure, stop_burn_in = await _test_plunger(
                    api, mount, recorder_report,
                    cycle=cycle, trials=trials,
                    continue_after_stall=continue_after_stall,
                    on_recorded=_save_recorder,
                )
                if had_failure:
                    test_plunger_passed = False
                if fail_reason:
                    test_plunger_fail_reasons.append(fail_reason)

                if stop_burn_in:
                    break

                # this is the old fix, we can use it if the fw reset doesn't work
                await _move_plunger_as_cycle_settings(api, mount)
                # await _reset_pipette_fw(api, mount)

                failed_cycles, stall_reason = await _cycle_plunger(
                    api, mount,
                    cycle=cycle, trials=TRIALS_PER_CYCLE,
                    continue_after_stall=continue_after_stall
                )
                if stall_reason:
                    cycle_plunger_stall_reasons.append(stall_reason)
                    cycle_plunger_passed = False
                data = [failed_cycles, CSVResult.from_bool(failed_cycles == 0)]
                results_report(
                    _get_cycling_section_tag(),
                    _get_cycling_test_tag(cycle),
                    data,
                )
                # Only stop all burn-in cycles when test_plunger fails at >= 0.55A.
                # Low-current failures and cycle stalls are recorded in SUMMARY but
                # do not skip remaining cycles.
            # Only run final test_plunger if burn-in was not stopped early
            if not stop_burn_in:
                _max_failed, fail_reason, had_failure, stop_burn_in = await _test_plunger(
                    api, mount, recorder_report,
                    cycle=cycles * TRIALS_PER_CYCLE, trials=trials,
                    continue_after_stall=continue_after_stall,
                    on_recorded=_save_recorder,
                )
                if had_failure:
                    test_plunger_passed = False
                if fail_reason:
                    test_plunger_fail_reasons.append(fail_reason)
                data = [0, CSVResult.from_bool(0 == 0)]
                results_report(
                    _get_cycling_section_tag(),
                    _get_cycling_test_tag(cycles * TRIALS_PER_CYCLE),
                    data,
                )

            ui.print_title("DONE")
            _write_summary_and_save_results(
                results_report,
                results_path,
                test_plunger_passed=test_plunger_passed,
                cycle_plunger_passed=cycle_plunger_passed,
                test_plunger_fail_reasons=test_plunger_fail_reasons,
                cycle_plunger_stall_reasons=cycle_plunger_stall_reasons,
            )
            if api.is_simulator:
                break


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--cycles", type=int, default=DEFAULT_CYCLES)
    parser.add_argument("--trials", type=int, default=DEFAULT_TRIALS)
    parser.add_argument("--continue-after-stall", action="store_true")
    parser.add_argument(
        "--dry-run-reports",
        action="store_true",
        help="Build sample CSV reports only (no robot); smoke test for report logic",
    )
    args = parser.parse_args()
    if args.dry_run_reports:
        _dry_run_reports(args.cycles, args.trials)
    else:
        asyncio.run(_main(args.simulate, args.cycles, args.trials, args.continue_after_stall))
