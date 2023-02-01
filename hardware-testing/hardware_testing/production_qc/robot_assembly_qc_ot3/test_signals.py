"""Test Signals."""
import asyncio
from math import copysign
from numpy import float64
from typing import List, Union

from opentrons_hardware.drivers.gpio import OT3GPIO
from opentrons_hardware.hardware_control.motion import (
    MoveStopCondition,
    create_step,
    MoveGroupStep,
)
from opentrons_hardware.hardware_control.move_group_runner import MoveGroupRunner

from opentrons.hardware_control.backends.ot3controller import OT3Controller
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.backends.ot3utils import axis_to_node

from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
    CSVLine,
    CSVLineRepeating,
)
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


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
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
    assert nsync or estop, "either nsync or estop must be used as a stop signal"
    if nsync:
        stop = MoveStopCondition.sync_line
    else:
        stop = MoveStopCondition.none
    _move_group_nsync = _build_move_group(MOVING_DISTANCE, MOVING_SPEED, stop)
    runner = MoveGroupRunner(move_groups=[[_move_group_nsync]])
    if api.is_simulator:
        # test that the required functionality exists
        assert runner.run
        assert OT3Controller.gpio_chardev
        assert OT3GPIO.activate_nsync_out
        assert OT3GPIO.deactivate_nsync_out
        assert OT3GPIO.activate_estop
        assert OT3GPIO.deactivate_estop
    else:
        sig_msg = "nsync" if nsync else "estop"
        backend: OT3Controller = api._backend  # type: ignore[assignment]
        messenger = backend._messenger
        gpio = backend.gpio_chardev
        if nsync:
            _sig_msg = "nsync"
            _activate = gpio.activate_nsync_out
            _deactivate = gpio.deactivate_nsync_out
        else:
            _sig_msg = "estop"
            _activate = gpio.activate_estop
            _deactivate = gpio.deactivate_estop

        async def _sleep_then_active_stop_signal() -> None:
            print(f"pausing 1 second before activating {_sig_msg}")
            await asyncio.sleep(1)
            print(f"activating {_sig_msg}")
            _activate()
            print(f"pausing 1 second before deactivating {_sig_msg}")
            await asyncio.sleep(1)
            print(f"deactivating {_sig_msg}")
            _deactivate()

        async def _do_the_moving() -> None:
            if nsync:
                await runner.run(can_messenger=messenger)
            else:
                try:
                    await runner.run(can_messenger=messenger)
                except RuntimeError:
                    print("caught runtime error from estop")

        print(f"deactivate {sig_msg}")
        _deactivate()
        print("pause 0.5 seconds")
        await asyncio.sleep(0.5)
        move_coro = _do_the_moving()
        stop_coro = _sleep_then_active_stop_signal()
        print(f"moving {MOVING_DISTANCE} at speed {MOVING_SPEED}")
        await asyncio.gather(stop_coro, move_coro)
    await api.refresh_current_position_ot3()


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""
    print("homing")
    await api.home()
    mount = OT3Axis.to_mount(MOVING_Z_AXIS)
    home_pos = await api.gantry_position(mount)

    print("testing sync signal")
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
    result = CSVResult.from_bool(home_pos.magnitude_to(stop_pos) < MOVING_DISTANCE / 2)
    print(f"nsync result: {result}")
    report(section, "nsync-result", [result])

    # E-STOP
    await _move_and_trigger_stop_signal(api, estop=True)
    # TODO: check to see what happens here
    report(section, "estop-result", [CSVResult.PASS])
