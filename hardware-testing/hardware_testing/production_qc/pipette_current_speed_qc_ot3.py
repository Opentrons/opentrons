"""Pipette Current/Speed Test."""
import argparse
import asyncio

from opentrons.config.defaults_ot3 import DEFAULT_RUN_CURRENT, DEFAULT_MAX_SPEEDS

from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
    CSVSection,
    CSVLine,
    RESULTS_OVERVIEW_TITLE,
)
from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.data import ui

STALL_THRESHOLD_MM = 0.25
TEST_SPEEDS = [20, 40, 60, 80, 100]
PLUNGER_CURRENTS_SPEED = {
    0.1: TEST_SPEEDS,
    0.25: TEST_SPEEDS,
    0.5: TEST_SPEEDS,
    0.75: TEST_SPEEDS,
    1.0: TEST_SPEEDS,
}


def _get_test_tag(current: float, speed: float, pos: str) -> str:
    return f"current-{current}-speed-{speed}-{pos}"


def _build_csv_report() -> CSVReport:
    _report = CSVReport(
        test_name="pipette-current-speed-qc-ot3",
        sections=[
            CSVSection(
                title="CURRENTS-SPEEDS",
                lines=[
                    CSVLine(
                        _get_test_tag(current, speed, pos),
                        [float, float, float, float, CSVResult],
                    )
                    for current, speeds in PLUNGER_CURRENTS_SPEED.items()
                    for speed in speeds
                    for pos in ["start", "end"]
                ],
            ),
        ],
    )
    return _report


async def _main(is_simulating: bool) -> None:
    default_current = DEFAULT_RUN_CURRENT.low_throughput[types.OT3AxisKind.P]
    default_speed = DEFAULT_MAX_SPEEDS.low_throughput[types.OT3AxisKind.P]
    max_current = max(list(PLUNGER_CURRENTS_SPEED.keys()))
    max_speed = max(TEST_SPEEDS)
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=is_simulating,
        pipette_left="p1000_single_v3.4",
        pipette_right="p1000_multi_v3.4",
    )
    pips = {
        types.OT3Mount.from_mount(m): p for m, p in api.hardware_pipettes.items() if p
    }
    assert pips, "no pipettes attached"
    if not api.is_simulator:
        _operator = input("enter OPERATOR name: ")
    else:
        _operator = "simulation"
    for mount, pipette in pips.items():
        # get info about pipette
        pipette_sn = helpers_ot3.get_pipette_serial_ot3(pipette)
        pipette_ax = types.OT3Axis.of_main_tool_actuator(mount)
        plunger_poses = helpers_ot3.get_plunger_positions_ot3(api, mount)
        top, bottom, blowout, drop_tip = plunger_poses
        # create CSV report
        report = _build_csv_report()
        report.set_tag(pipette_sn)
        report.set_version("unknown")
        report.set_operator(_operator)
        ui.print_title(f"{pipette_sn} - {mount.name}")
        if not api.is_simulator and not ui.get_user_answer("QC this pipette"):
            continue

        async def _home() -> None:
            # restore default current/speed before homing
            await helpers_ot3.set_gantry_load_per_axis_current_settings_ot3(
                api, pipette_ax, run_current=default_current
            )
            await helpers_ot3.set_gantry_load_per_axis_motion_settings_ot3(
                api, pipette_ax, default_max_speed=default_speed
            )
            await api.home([pipette_ax])

        async def _move_plunger(p: float, s: float, c: float) -> None:
            # set max currents/speeds, to make sure we're not accidentally limiting ourselves
            await helpers_ot3.set_gantry_load_per_axis_current_settings_ot3(
                api, pipette_ax, run_current=max_current
            )
            await helpers_ot3.set_gantry_load_per_axis_motion_settings_ot3(
                api, pipette_ax, default_max_speed=max_speed
            )
            # move
            await helpers_ot3.move_plunger_absolute_ot3(
                api, mount, p, speed=s, motor_current=c
            )

        async def _store_result(c: float, s: float, pos: str) -> bool:
            _current_pos = await api.current_position_ot3(mount)
            est = _current_pos[pipette_ax]
            if not api.is_simulator:
                _encoder_poses = await api.encoder_current_position_ot3(mount)
                enc = _encoder_poses[pipette_ax]
            else:
                enc = est
            _stalled_mm = est - enc
            print(f"{pos}: motor={est}, encoder={enc}")
            _did_pass = abs(_stalled_mm) < STALL_THRESHOLD_MM
            _tag = _get_test_tag(c, s, pos)
            report("CURRENTS-SPEEDS", _tag, [c, s, est, enc, CSVResult.from_bool(_did_pass)])
            return _did_pass

        for current, speeds in PLUNGER_CURRENTS_SPEED.items():
            for speed in speeds:
                ui.print_header(f"CURRENT = {current}; SPEED = {speed}")
                await _home()
                did_pass_start = await _store_result(current, speed, "start")
                await _move_plunger(drop_tip, speed, current)
                did_pass_end = await _store_result(current, speed, "end")
                if not did_pass_start or not did_pass_end:
                    print(f"failed {current} amps at {speed} mm/sec")
                    print("skipping remaining speeds at this current")
                    break

        report_path = report.save_to_disk()
        complete_msg = "complete" if report.completed else "incomplete"
        print(f"done, {complete_msg} report -> {report_path}")
        print("Overall Results:")
        for line in report[RESULTS_OVERVIEW_TITLE].lines:
            print(f" - {line.tag}: {line.result}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    args = parser.parse_args()
    asyncio.run(_main(args.simulate))
