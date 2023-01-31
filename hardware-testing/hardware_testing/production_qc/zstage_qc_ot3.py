import argparse
import asyncio
from numpy import float64
import subprocess
from typing import Dict, Tuple

from opentrons_hardware.drivers.can_bus.build import build_driver
from opentrons_hardware.drivers.can_bus import CanMessenger, WaitableCallback
from opentrons_hardware.firmware_bindings.constants import NodeId, PipetteName
from opentrons_hardware.hardware_control.current_settings import set_currents
from opentrons_hardware.hardware_control.motion import (
    MoveGroupSingleAxisStep,
    create_home_step,
)
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    InstrumentInfoRequest,
)
from opentrons_hardware.hardware_control.move_group_runner import MoveGroupRunner
from opentrons_hardware.scripts.can_args import add_can_args, build_settings

from hardware_testing.drivers.pressure_fixture import mark10_fg



currents = (0.2, 0.5, 1.0, 1.5)
speeds = (50, 100)
ZSTAGE_TOLERANCES_MM = 0.4

data_format = "||{0:^12}|{1:^12}|{2:^12}||"

CYCLES = 10
sus_str = "----_----"


async def _home(messenger: CanMessenger) -> None:
    home_runner = MoveGroupRunner(
        move_groups=[[create_home_step({NODE: float64(100.0)}, {NODE: float64(-5)})]]
    )
    await home_runner.run(can_messenger=messenger)


async def _set_pipette_current(messenger: CanMessenger, run_current: float) -> None:
    currents: Dict[NodeId, Tuple[float, float]] = dict()
    currents[NODE] = (float(0), float(run_current))
    try:
        await set_currents(messenger, currents)
    except asyncio.CancelledError:
        pass


class LoseStepError(Exception):
    """Lost Step Error."""

    pass


async def _move_to(
    messenger: CanMessenger,
    distance: float,
    velocity: float,
    check: bool = False,
) -> Tuple[float, float]:
    move_runner = MoveGroupRunner(
        move_groups=[
            [
                {
                    NODE: MoveGroupSingleAxisStep(
                        distance_mm=float64(0),
                        velocity_mm_sec=float64(velocity),
                        duration_sec=float64(abs(distance / velocity)),
                    )
                }
            ]
        ],
    )
    axis_dict = await move_runner.run(can_messenger=messenger)
    motor_pos = float(axis_dict[NODE][0])
    encoder_pos = float(axis_dict[NODE][1])
    motor_str = str(round(motor_pos, 2))
    encoder_str = str(round(motor_pos, 2))
    if check and abs(motor_pos - encoder_pos) > ZSTAGE_TOLERANCES_MM:
        raise LoseStepError(
            f"ERROR: lost steps (motor={motor_str}, encoder={encoder_str}"
        )
    return motor_pos, encoder_pos


async def _run(messenger: CanMessenger) -> None:
    if "q" in input("\n\tEnter 'q' to exit"):
        raise KeyboardInterrupt()
    results = []
    print("--------------Test Currents--------------")

    #
    


async def _main(arguments: argparse.Namespace) -> None:
    subprocess.run(["systemctl", "stop", "opentrons-robot-server"])
    driver = await build_driver(build_settings(arguments))
    messenger = CanMessenger(driver=driver)
    messenger.start()
    while True:
        try:
            await _run(messenger)
        except KeyboardInterrupt:
            break
        except Exception:
            pass


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Pipette Currents Test SCRIPT")
    add_can_args(parser)
    parser.add_argument(
        "--plunger_run_current",
        type=float,
        help="Active current of the plunger",
        default=1.0,
    )
    parser.add_argument(
        "--plunger_hold_current",
        type=float,
        help="Active current of the plunger",
        default=0.1,
    )
    parser.add_argument(
        "--speed",
        type=float,
        help="The speed with which to move the plunger",
        default=10.0,
    )
    asyncio.run(_main(parser.parse_args()))