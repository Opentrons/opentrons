"""Test Signals."""
import asyncio
from math import copysign
from numpy import float64
from typing import List

from opentrons_hardware.hardware_control.motion import (
    MoveStopCondition,
    create_step,
    MoveGroupStep,
)
from opentrons_hardware.hardware_control.move_group_runner import MoveGroupRunner

from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.backends.ot3utils import axis_to_node

from hardware_testing.data.csv_report import CSVReport, CSVResult, CSVLine
from hardware_testing.opentrons_api.types import OT3Axis, Point

MOVING_Z_AXIS = OT3Axis.Z_L
MOVING_SPEED = 10
MOVING_DISTANCE = 100


def _build_move_group(
    distance: float, speed: float, stop: MoveStopCondition
) -> MoveGroupStep:
    movers = [
        axis_to_node(OT3Axis.X),
        axis_to_node(OT3Axis.Y),
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


def build_csv_lines() -> List[CSVLine]:
    """Build CSV Lines."""
    return [
        CSVLine("nsync-target-pos", [float, float, float]),
        CSVLine("nsync-stop-pos", [float, float, float]),
        CSVLine("nsync-result", [CSVResult]),
        CSVLine("estop-result", [CSVResult]),
    ]


async def _move_and_trigger_stop_signal(
    api: OT3API, nsync: bool = False, estop: bool = True
) -> None:
    assert nsync or estop, f"either nsync or estop must be used as a stop signal"
    if nsync:
        stop = MoveStopCondition.sync_line
    else:
        stop = MoveStopCondition.none
    _move_group_nsync = _build_move_group(MOVING_DISTANCE, MOVING_SPEED, stop)
    runner = MoveGroupRunner(move_groups=[[_move_group_nsync]])
    if not api.is_simulator:
        # initialize the GPIO pin
        backend = api._backend
        gpio = backend.gpio_chardev
        if nsync:
            _activate = gpio.activate_nsync_out
            _deactivate = gpio.deactivate_nsync_out
        else:
            _activate = gpio.activate_estop
            _deactivate = gpio.deactivate_estop

        async def _sleep_then_active_stop_signal() -> None:
            await asyncio.sleep(1)
            _activate()
            await asyncio.sleep(1)
            _deactivate()

        _deactivate()
        await asyncio.sleep(0.5)
        move_coro = runner.run(can_messenger=backend._messenger)
        stop_coro = _sleep_then_active_stop_signal()
        await asyncio.gather(stop_coro, move_coro)
    await api.refresh_current_position_ot3()


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""
    await api.home()
    mount = OT3Axis.to_mount(MOVING_Z_AXIS)
    home_pos = await api.gantry_position(mount)

    # NSYNC
    target_pos = home_pos + Point(
        x=-MOVING_DISTANCE, y=-MOVING_DISTANCE, z=-MOVING_DISTANCE
    )
    report(
        section,
        "nsync-target-pos",
        [float(target_pos.x), float(target_pos.y), float(target_pos.z)],
    )
    await _move_and_trigger_stop_signal(api, nsync=True)
    stop_pos = await api.gantry_position(mount)
    report(
        section,
        "nsync-stop-pos",
        [float(stop_pos.x), float(stop_pos.y), float(stop_pos.z)],
    )
    if home_pos.magnitude_to(stop_pos) < MOVING_DISTANCE / 2:
        report(section, "nsync-result", [CSVResult.PASS])
    else:
        report(section, "nsync-result", [CSVResult.FAIL])

    # E-STOP
    await _move_and_trigger_stop_signal(api, estop=True)
    # TODO: check to see what happens here
    report(section, "estop-result", [CSVResult.PASS])
