import os
import time
from typing import Dict

import argparse
from hardware_testing.opentrons_api import helpers_ot3
from opentrons.drivers.flex_stacker.driver import (
    FlexStackerDriver,
    STACKER_MOTION_CONFIG,
)

from opentrons.drivers.flex_stacker.types import (
    Direction,
    LEDColor,
    LEDPattern,
    MoveResult,
    StackerAxis,
    StallGuardParams,
)

from typing import Optional

from opentrons_shared_data.errors.exceptions import FlexStackerStallError
from opentrons.hardware_control.modules.types import (
    StackerAxisState,
)

import asyncio 

STACKER_STATES: Dict[FlexStackerDriver, Dict[str, bool]] = {}


async def stacker_setup() -> FlexStackerDriver:
    """Detect Stackers."""
    serial_port_name = "/dev/ttyACM1"
    stacker = await FlexStackerDriver.create(
        port= serial_port_name, loop=asyncio.get_running_loop()
    )
    STACKER_STATES[stacker] = {
        "stall_detected": False,
        "device_info": (await stacker.get_device_info()).to_dict(),
        "limit_switch_status": {},
    }
    await stacker.set_led(
        power=0.5, color=LEDColor.GREEN, pattern=LEDPattern.STATIC
    )
    # Enable stall guard
    await stacker.set_stallguard_threshold(StackerAxis.X, False, 0)
    return stacker

async def home_axis(
    stacker: FlexStackerDriver,
    axis: StackerAxis,
    direction: Direction,
    speed: Optional[float] = None,
    acceleration: Optional[float] = None,
    current: Optional[float] = None,
) -> bool:
    """Home flex stacker axis."""
    default = STACKER_MOTION_CONFIG[axis]["home"]
    await stacker.set_run_current(
        axis, current if current is not None else default.run_current
    )
    await stacker.set_ihold_current(axis, default.hold_current)
    motion_params = default.move_params.update(
        max_speed=speed, acceleration=acceleration
    )

    success = await stacker.move_to_limit_switch(
        axis=axis, direction=direction, params=motion_params
    )
    # if success == MoveResult.STALL_ERROR:
    #     STACKER_STATES[stacker]["stall_detected"] = True
    #     raise FlexStackerStallError(
    #         STACKER_STATES[stacker]["device_info"]["serial"], axis
    #     )
    return success == MoveResult.NO_ERROR

async def move_axis(
    stacker: FlexStackerDriver,
    axis: StackerAxis,
    direction: Direction,
    distance: float,
    speed: Optional[float] = None,
    acceleration: Optional[float] = None,
    current: Optional[float] = None,
) -> bool:
    """Move the axis in a direction by the given distance in mm."""
    default = STACKER_MOTION_CONFIG[axis]["move"]
    await stacker.set_run_current(
        axis, current if current is not None else default.run_current
    )
    await stacker.set_ihold_current(axis, default.hold_current)
    motion_params = default.move_params.update(
        max_speed=speed, acceleration=acceleration
    )
    distance = direction.distance(distance)
    res = None
    try:
        res = await stacker.move_in_mm(axis, distance, params=motion_params)
        # if res == MoveResult.STALL_ERROR:
        #     STACKER_STATES[stacker]["stall_detected"] = True

            # raise FlexStackerStallError(
            #     STACKER_STATES[stacker]["device_info"]["serial"], axis
            # )
    except Exception as e:
        pass
    print(f'stall_detection: {res}')
    return res

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description="FlexStacker Motion Parameter Test Script")
    arg_parser.add_argument("-c", "--cycles", default = 50, help = "number of cycles to execute")
    arg_parser.add_argument("-a", "--axis", default = 'Z', help = "Choose a Axis to test: X, Z, or L")
    arg_parser.add_argument("-g", "--gauge", default = True, type=bool,  help = "if a dial gauge is connected")
    return arg_parser

async def main(args: argparse.Namespace) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating = False,
        use_defaults = True,
    )
    for module in api.attached_modules:
        # stop pollers
        await module._poller.stop() # type: ignore
    s = await stacker_setup()
    test_axis = StackerAxis.X
    for x in range(1, args.cycles+1):
        print(f"Cycle: {x} of {args.cycles}")
        await home_axis(s, test_axis, Direction.RETRACT, 50)
        await move_axis(s, test_axis, Direction.EXTEND, 50)
        distance = 250
        # distance = float(input("Enter distance to move in mm: "))
        await move_axis(s, test_axis, Direction.EXTEND, distance)

if __name__ == '__main__':
    arg_parser = build_arg_parser()
    args = arg_parser.parse_args()
    asyncio.run(main(args))