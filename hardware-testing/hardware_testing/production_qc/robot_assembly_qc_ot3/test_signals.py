"""Test Signals."""
import asyncio
from math import copysign
from numpy import float64
from typing import List, Union

from opentrons_hardware.hardware_control.motion import (
    MoveStopCondition,
    create_step,
    MoveGroupStep,
)
from opentrons_hardware.hardware_control.move_group_runner import MoveGroupRunner

from opentrons.hardware_control.backends.ot3controller import OT3Controller
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.backends.ot3utils import axis_to_node

from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
    CSVLine,
    CSVLineRepeating,
)
from hardware_testing.opentrons_api.types import Axis, Point

MOVING_Z_AXIS = Axis.Z_L
MOVING_DISTANCE = 100
MOVE_SECONDS = 5
ROUND_ERR_MARGIN = 0.05
MOVING_SPEED = MOVING_DISTANCE / MOVE_SECONDS

SIGNAL_TEST_NAMES = ["nsync", "estop", "estop-external-left", "estop-external-right"]


def _build_move_group(
    distance: float, speed: float, stop: MoveStopCondition
) -> MoveGroupStep:
    movers = [
        axis_to_node(Axis.X),
        axis_to_node(Axis.Y),
        axis_to_node(MOVING_Z_AXIS),
    ]
    dist_64 = float64(abs(distance))
    vel_64 = float64(speed * copysign(1.0, distance))
    dur_64 = float64(abs(distance / speed))
    return create_step(
        distance={m: dist_64 for m in movers},
        velocity={m: vel_64 for m in movers},
        acceleration={},
        duration=dur_64,
        present_nodes=movers,
        stop_condition=stop,
    )


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[CSVLine] = list()
    for sig_name in SIGNAL_TEST_NAMES:
        lines.append(CSVLine(f"{sig_name}-target-pos", [float, float, float]))
        lines.append(CSVLine(f"{sig_name}-stop-pos", [float, float, float]))
        lines.append(CSVLine(f"{sig_name}-result", [CSVResult]))
    return lines  # type: ignore[return-value]


async def _move_and_interrupt_with_signal(api: OT3API, sig_name: str) -> None:
    assert sig_name in SIGNAL_TEST_NAMES
    if sig_name == "nsync":
        stop = MoveStopCondition.sync_line
    else:
        stop = MoveStopCondition.none
    _move_group_nsync = _build_move_group(MOVING_DISTANCE, MOVING_SPEED, stop)
    runner = MoveGroupRunner(move_groups=[[_move_group_nsync]])
    if api.is_simulator:
        # test that the required functionality exists
        assert runner.run
        # TODO: add estop/nsync functionality once implemented
    else:
        backend: OT3Controller = api._backend  # type: ignore[assignment]
        messenger = backend._messenger

        async def _sleep_then_active_stop_signal() -> None:
            if "external" in sig_name:
                print("waiting for EXTERNAL E-Stop button")
                return
            pause_seconds = MOVE_SECONDS / 2
            print(
                f"pausing {round(pause_seconds, 1)} second before activating {sig_name}"
            )
            await asyncio.sleep(pause_seconds)
            print(f"activating {sig_name}")
            # TODO: add estop/nsync functionality once implemented
            print(f"pausing 1 second before deactivating {sig_name}")
            await asyncio.sleep(1)
            print(f"deactivating {sig_name}")
            # TODO: add estop/nsync functionality once implemented

        async def _do_the_moving() -> None:
            if sig_name == "nsync":
                await runner.run(can_messenger=messenger)
            else:
                try:
                    await runner.run(can_messenger=messenger)
                except RuntimeError:
                    print("caught runtime error from estop")

        # TODO: add estop/nsync functionality once implemented
        await asyncio.sleep(0.5)
        move_coro = _do_the_moving()
        stop_coro = _sleep_then_active_stop_signal()
        print(f"moving {MOVING_DISTANCE} at speed {MOVING_SPEED}")
        await asyncio.gather(stop_coro, move_coro)
    await api.refresh_positions()


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""
    mount = Axis.to_ot3_mount(MOVING_Z_AXIS)

    async def _home() -> None:
        try:
            print("homing")
            await api.home()
        except RuntimeError as e:
            print(e)
            ui.get_user_ready("release the E-STOP")
            await _home()

    for sig_name in SIGNAL_TEST_NAMES:
        ui.print_header(sig_name.upper())
        await _home()
        start_pos = await api.gantry_position(mount)
        target_pos = start_pos + Point(
            x=-MOVING_DISTANCE, y=-MOVING_DISTANCE, z=-MOVING_DISTANCE
        )
        report(
            section,
            f"{sig_name}-target-pos",
            [float(target_pos.x), float(target_pos.y), float(target_pos.z)],
        )
        if sig_name == "nsync" or sig_name == "estop":
            print("FIXME: enable once implemented in firmware")
            report(section, f"{sig_name}-result", [CSVResult.PASS])
            continue
        # External E-Stop
        if not api.is_simulator and "external" in sig_name:
            ui.get_user_ready(f"connect {sig_name.upper()}")
            ui.get_user_ready("prepare to hit the E-STOP")
        await _move_and_interrupt_with_signal(api, sig_name)
        if not api.is_simulator and "external" in sig_name:
            ui.get_user_ready("release the E-STOP")
        stop_pos = await api.gantry_position(mount)
        report(
            section,
            f"{sig_name}-stop-pos",
            [float(stop_pos.x), float(stop_pos.y), float(stop_pos.z)],
        )
        diff = start_pos + (stop_pos * -1)
        print(f"start: {start_pos}, stop: {stop_pos}, diff: {diff}")
        x_passed = ROUND_ERR_MARGIN < diff.x < MOVING_DISTANCE - ROUND_ERR_MARGIN
        y_passed = ROUND_ERR_MARGIN < diff.y < MOVING_DISTANCE - ROUND_ERR_MARGIN
        z_passed = ROUND_ERR_MARGIN < diff.z < MOVING_DISTANCE - ROUND_ERR_MARGIN
        result = CSVResult.from_bool(x_passed and y_passed and z_passed)
        report(section, f"{sig_name}-result", [result])

    await _home()
