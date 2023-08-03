"""Mount Current/Speed Test."""
import argparse
import asyncio

from opentrons.hardware_control.ot3api import OT3API
from opentrons.config.defaults_ot3 import (
    DEFAULT_RUN_CURRENT,
    DEFAULT_MAX_SPEEDS,
    DEFAULT_ACCELERATIONS,
    DEFAULT_MAX_SPEED_DISCONTINUITY,
)
from opentrons_shared_data.errors.exceptions import StallOrCollisionDetectedError

from hardware_testing.data import get_git_description
from hardware_testing.data.csv_report import (
    RESULTS_OVERVIEW_TITLE,
    CSVReport,
    CSVResult,
    CSVSection,
    CSVLine,
)
from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.data import ui

TEST_TAG = "CURRENTS-SPEEDS"

MAX_TRAVEL_MM = 215

axis_kind = types.OT3AxisKind.Z
DEFAULT_ACCELERATION = DEFAULT_ACCELERATIONS.low_throughput[axis_kind]
DEFAULT_CURRENT = DEFAULT_RUN_CURRENT.low_throughput[axis_kind]
DEFAULT_SPEED = DEFAULT_MAX_SPEEDS.low_throughput[axis_kind]
DEFAULT_DISCONTINUITY = DEFAULT_MAX_SPEED_DISCONTINUITY.low_throughput[axis_kind]

MUST_PASS_CURRENT = DEFAULT_CURRENT * 0.6  # the target spec (must pass here)
STALL_THRESHOLD_MM = 0.1
TEST_SPEEDS = [DEFAULT_MAX_SPEEDS.low_throughput[types.OT3AxisKind.Z]]
TEST_CURRENTS_SPEED = {
    0.1: TEST_SPEEDS,
    round(MUST_PASS_CURRENT - 0.3, 1): TEST_SPEEDS,
    round(MUST_PASS_CURRENT - 0.2, 1): TEST_SPEEDS,
    round(MUST_PASS_CURRENT - 0.1, 1): TEST_SPEEDS,
    round(MUST_PASS_CURRENT, 1): TEST_SPEEDS,
    DEFAULT_CURRENT: TEST_SPEEDS,
}
TEST_DISCONTINUITY = 15  # used during gravimetric tests

MAX_CURRENT = max(max(list(TEST_CURRENTS_SPEED.keys())), 1.0)
MAX_SPEED = max(TEST_SPEEDS)


def _get_test_tag(
    mount: types.OT3Mount, current: float, speed: float, direction: str, pos: str
) -> str:
    return f"{mount.name.lower()}-current-{current}-speed-{speed}-{direction}-{pos}"


def _build_csv_report() -> CSVReport:
    _report = CSVReport(
        test_name="mount-current-speed-qc-ot3",
        sections=[
            CSVSection(
                title="OVERALL",
                lines=[
                    CSVLine("failing-current-left", [float, CSVResult]),
                    CSVLine("failing-current-right", [float, CSVResult]),
                ],
            ),
            CSVSection(
                title=TEST_TAG,
                lines=[
                    CSVLine(
                        _get_test_tag(mount, current, speed, direction, pos),
                        [float, float, float, float, CSVResult],
                    )
                    for mount in [types.OT3Mount.LEFT, types.OT3Mount.RIGHT]
                    for current, speeds in TEST_CURRENTS_SPEED.items()
                    for speed in speeds
                    for direction in ["down", "up"]
                    for pos in ["start", "end"]
                ],
            ),
        ],
    )
    return _report


async def _home_mount(api: OT3API, mount: types.OT3Mount) -> None:
    # restore default current/speed before homing
    z_ax = types.Axis.by_mount(mount)
    await helpers_ot3.set_gantry_load_per_axis_current_settings_ot3(
        api, z_ax, run_current=DEFAULT_CURRENT
    )
    await helpers_ot3.set_gantry_load_per_axis_motion_settings_ot3(
        api, z_ax, default_max_speed=DEFAULT_SPEED, max_speed_discontinuity=DEFAULT_DISCONTINUITY,
    )
    await api.home([z_ax])


async def _move_mount(
    api: OT3API,
    mount: types.OT3Mount,
    distance: float,
    speed: float,
    current: float,
) -> None:
    z_ax = types.Axis.by_mount(mount)
    async with api.restore_system_constrants():
        await helpers_ot3.set_gantry_load_per_axis_current_settings_ot3(
            api, z_ax, run_current=current
        )
        await helpers_ot3.set_gantry_load_per_axis_motion_settings_ot3(
            api,
            z_ax,
            default_max_speed=speed,
            max_speed_discontinuity=TEST_DISCONTINUITY,
        )
        # move
        await api.move_rel(mount, types.Point(x=0, y=0, z=distance), speed=speed)


async def _record_mount_alignment(
    api: OT3API,
    mount: types.OT3Mount,
    report: CSVReport,
    current: float,
    speed: float,
    direction: str,
    position: str,
) -> bool:
    ax = types.Axis.by_mount(mount)
    _current_pos = await api.current_position_ot3(mount)
    est = _current_pos[ax]
    if not api.is_simulator:
        _encoder_poses = await api.encoder_current_position_ot3(mount)
        enc = _encoder_poses[ax]
    else:
        enc = est
    _stalled_mm = est - enc
    print(f"{position}: motor={est}, encoder={enc}")
    _did_pass = abs(_stalled_mm) < STALL_THRESHOLD_MM
    _tag = _get_test_tag(mount, current, speed, direction, position)
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
    direction: str,
) -> bool:
    # check that encoder/motor align
    aligned = await _record_mount_alignment(
        api, mount, report, current, speed, direction, "start"
    )
    if not aligned:
        return False
    # move the mount
    distance = {"down": -MAX_TRAVEL_MM, "up": MAX_TRAVEL_MM}[direction]
    try:
        await _move_mount(api, mount, distance, speed, current)
        # check that encoder/motor still align
        aligned = await _record_mount_alignment(
            api, mount, report, current, speed, direction, "end"
        )
    except StallOrCollisionDetectedError as e:
        print(e)
        aligned = False
        await _home_mount(api, mount)
    return aligned


async def _test_mount(api: OT3API, mount: types.OT3Mount, report: CSVReport) -> float:
    await api.home_z(mount)
    # start at HIGHEST (easiest) current
    currents = sorted(list(TEST_CURRENTS_SPEED.keys()), reverse=True)
    for current in currents:
        # start at LOWEST (easiest) speed
        speeds = sorted(TEST_CURRENTS_SPEED[current], reverse=False)
        for speed in speeds:
            ui.print_header(f"CURRENT = {current}; SPEED = {speed}")
            await _home_mount(api, mount)
            for direction in ["down", "up"]:
                _pass = await _test_direction(
                    api, mount, report, current, speed, direction
                )
                if not _pass:
                    ui.print_error(
                        f"failed moving {direction} at {current} amps and {speed} mm/sec"
                    )
                    return current
    return 0.0


async def _reset_gantry(api: OT3API) -> None:
    # TODO: home entire gantry?
    await _home_mount(api, types.OT3Mount.LEFT)
    await _home_mount(api, types.OT3Mount.RIGHT)
    # TODO: move XY motors at all?
    # home_pos = await api.gantry_position(
    #     types.OT3Mount.RIGHT, types.CriticalPoint.MOUNT
    # )
    # test_pos = helpers_ot3.get_slot_calibration_square_position_ot3(5)
    # test_pos = test_pos._replace(z=home_pos.z)
    # await api.move_to(
    #     types.OT3Mount.RIGHT, test_pos, critical_point=types.CriticalPoint.MOUNT
    # )


async def _main(is_simulating: bool) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=is_simulating,
    )
    if not api.is_simulator:
        operator = input("enter OPERATOR name: ")
    else:
        operator = "simulation"

    report = _build_csv_report()
    report.set_version(get_git_description())
    report.set_operator(operator)
    robot_sn = helpers_ot3.get_robot_serial_ot3(api)
    report.set_robot_id(robot_sn)
    report.set_tag(robot_sn)
    report.set_device_id(robot_sn, CSVResult.PASS)

    for mount in [types.OT3Mount.LEFT, types.OT3Mount.RIGHT]:
        ui.print_header(mount.name)
        # home and move to a safe position
        await _reset_gantry(api)
        # make sure no instruments are attached
        has_pips = bool([pip for pip in api.hardware_pipettes.values() if pip])
        if api.has_gripper() or has_pips:
            raise RuntimeError("remove all pipettes and grippers from robot")
        failing_current = await _test_mount(api, mount, report)
        report(
            "OVERALL",
            f"failing-current-{mount.name.lower()}",
            [
                failing_current,
                CSVResult.from_bool(failing_current < MUST_PASS_CURRENT),
            ],
        )

    # SAVE REPORT
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
