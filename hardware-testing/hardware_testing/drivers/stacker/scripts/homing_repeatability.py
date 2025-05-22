import os
import sys
sys.path.append('../../')
from hardware_testing.drivers import mitutoyo_digimatic_indicator as dial_indicator
import csv
import time
from typing import Dict
import numpy as np
import argparse
from datetime import datetime
import asyncio

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

from opentrons_shared_data.errors.exceptions import FlexStackerStallError
from typing import Optional
from opentrons.hardware_control.modules.types import (
    StackerAxisState,
)

STACKER_STATES: Dict[FlexStackerDriver, Dict[str, bool]] = {}

# StallGuard configuration
STALLGUARD_CONFIG = {
    StackerAxis.X: StallGuardParams(StackerAxis.X, True, 2),
    StackerAxis.Z: StallGuardParams(StackerAxis.Z, True, 2)
}

TEST_PARAMETERS: Dict[str, Dict[str, Dict[str, Dict[str, float]]]] = {
    "Plate_stacker": {
        StackerAxis.X: {
            "SPEED": {"MIN": 200, "MAX": 200, "INC": 50},
            "ACCEL": {"MIN": 1500, "MAX": 1500, "INC": 500},
            "CURRENT": {"MIN": 1.2, "MAX": 1.2, "INC": 0.1},
            "MAX_SPEED_DISCONTINUITY": {"MIN": 5, "MAX": 80, "INC": 5}
        },
        StackerAxis.Z: {
            "SPEED": {"MIN": 150, "MAX": 150, "INC": 50},
            "ACCEL": {"MIN": 500, "MAX": 500, "INC": 10},
            "CURRENT": {"MIN": 1.5, "MAX": 1.5, "INC": 0.1},
            "MAX_SPEED_DISCONTINUITY": {"MIN": 5, "MAX": 50, "INC": 5}
        },
        StackerAxis.L: {
            "SPEED": {"MIN": 0, "MAX": 200, "INC": 10},
            "ACCEL": {"MIN": 800, "MAX": 800, "INC": 50},
            "CURRENT": {"MIN": 0.1, "MAX": 1.5, "INC": 0.1},
            "MAX_SPEED_DISCONTINUITY": {"MIN": 40, "MAX": 40, "INC": 5}
        },
    },
}

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description="FlexStacker Motion Parameter Test Script")
    arg_parser.add_argument("-c", "--cycles", default = 10, type=int, help = "number of cycles to execute")
    arg_parser.add_argument("-a", "--axis", default = 'X', type=str, help = "Choose a Axis to test: X, Z, or L")
    arg_parser.add_argument("-g", "--gauge", default = True, type=bool,  help = "if a dial gauge is connected")
    return arg_parser

def parameter_range(test_axis: str, p_type: str) -> np.ndarray:
    """Makes a range of a parameter based on start, stop, step."""
    start = TEST_PARAMETERS["Plate_stacker"][test_axis][p_type]["MIN"]
    step = TEST_PARAMETERS["Plate_stacker"][test_axis][p_type]["INC"]

    if step == 0:
        return np.array([start])
    else:
        # add step to stop to make range inclusive
        stop = TEST_PARAMETERS["Plate_stacker"][test_axis][p_type]["MAX"] + step*0.5
        # print(start)
        # print(stop)
        # print(step)
        return np.arange(start, stop, step)

TABLE_RESULTS_KEY: Dict[str, Dict[float, int]] = {}

# dictionary containing lists of all speed/accel/current combinations to for each axis
def make_test_list(test_axis: StackerAxis) -> Dict[str, list]:
    """Make test list dictionary."""
    test_axis = list(test_axis)
    complete_test_list: Dict[str, list] = {}
    for axis_t in test_axis:
        axis_test_list = []
        TABLE_RESULTS_KEY[axis_t] = {}
        c_i = 0
        s_i = 0
        a_i = 0
        m_i = 0
        for current_t in parameter_range(axis_t, "CURRENT"):
            TABLE_RESULTS_KEY[axis_t][current_t] = c_i
            c_i = c_i + 1
            s_i = 0
            for speed_t in parameter_range(axis_t, "SPEED"):
                TABLE_RESULTS_KEY[axis_t][speed_t] = s_i
                s_i = s_i + 1
                a_i = 0
                for accel_t in parameter_range(axis_t, "ACCEL"):
                    TABLE_RESULTS_KEY[axis_t][accel_t] = a_i
                    a_i = a_i + 1
                    m_i = 0
                    for discontinuity in parameter_range(axis_t, "MAX_SPEED_DISCONTINUITY"):
                        TABLE_RESULTS_KEY[axis_t][discontinuity] = m_i
                        m_i = m_i + 1
                        axis_test_list.append(
                            {"CURRENT": current_t, "SPEED": speed_t, "ACCEL": accel_t, "MAX_SPEED_DISCONTINUITY": discontinuity}
                        )

        complete_test_list[axis_t] = axis_test_list

    return complete_test_list


async def reset_stall_detected(stacker: FlexStackerDriver) -> None:
    """Sets the statusbar to normal."""
    if STACKER_STATES[stacker]["stall_detected"]:
        await stacker.set_led(
            power=0.5, color=LEDColor.GREEN, pattern=LEDPattern.STATIC
        )
        STACKER_STATES[stacker]["stall_detected"] = False

async def get_limit_switch_status(stacker: FlexStackerDriver):
    """Get the limit switch status."""
    status = await stacker.get_limit_switches_status()
    STACKER_STATES[stacker]["limit_switch_status"] = {
        axis: StackerAxisState.from_status(status, axis) for axis in StackerAxis
    }
    return status

async def _move_and_home_axis(
    stacker: FlexStackerDriver,
    axis: StackerAxis,
    direction: Direction,
    offset: float = 0,
) -> MoveResult:
    MAX_TRAVEL = {
        StackerAxis.X: 194.0,
        StackerAxis.Z: 139.5,
        StackerAxis.L: 22.0,
    }
    distance = MAX_TRAVEL[axis] - offset
    await move_axis(stacker, axis, direction, distance)
    return await stacker.home_axis(axis, direction)

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
        if res == MoveResult.STALL_ERROR:
            STACKER_STATES[stacker]["stall_detected"] = True

            # raise FlexStackerStallError(
            #     STACKER_STATES[stacker]["device_info"]["serial"], axis
            # )
    except Exception as e:
        pass
    print(f'stall_detection: {res}')
    return res

async def open_latch(
    stacker: FlexStackerDriver,
    velocity: Optional[float] = None,
    acceleration: Optional[float] = None,
):
    """Open the latch."""
    MAX_TRAVEL = {
        StackerAxis.X: 194.0,
        StackerAxis.Z: 139.5,
        StackerAxis.L: 22.0,
    }
    # The latch only has one limit switch, so we have to travel a fixed distance
    # to open the latch.
    success = await move_axis(
        stacker,
        StackerAxis.L,
        Direction.EXTEND,
        distance=MAX_TRAVEL[StackerAxis.L],
        speed=velocity,
        acceleration=acceleration,
    )
    # Check that the latch is opened.
    await get_limit_switch_status(stacker)


async def close_latch(
    stacker: FlexStackerDriver,
    velocity: Optional[float] = None,
    acceleration: Optional[float] = None,
) -> bool:
    """Close the latch, dropping any labware its holding."""
    # Dont move the latch if its already closed.
    await get_limit_switch_status(stacker)
    if (
        STACKER_STATES[stacker]["limit_switch_status"][StackerAxis.L]
        == StackerAxisState.EXTENDED
    ):
        return True
    success = await home_axis(
        stacker,
        StackerAxis.L,
        Direction.RETRACT,
        speed=velocity,
        acceleration=acceleration,
    )
    # return sw_states.get(StackerAxis.L, Direction.RETRACT) == True
    return await get_limit_switch_status(stacker)

async def home_axis(
    stacker: FlexStackerDriver,
    axis: StackerAxis,
    direction: Direction,
    speed: Optional[float] = None,
    acceleration: Optional[float] = None,
    max_speed_discontinuity: Optional[float] = None,
    current: Optional[float] = None,
) -> bool:
    """Home flex stacker axis."""
    default = STACKER_MOTION_CONFIG[axis]["home"]
    print(f'default: {default}')
    await stacker.set_run_current(
        axis, current if current is not None else default.run_current
    )
    await stacker.set_ihold_current(axis, default.hold_current)
    motion_params = default.move_params.update(
        max_speed=speed, 
        acceleration=acceleration, 
        max_speed_discont=max_speed_discontinuity,
    )

    success = await stacker.move_to_limit_switch(
        axis=axis, direction=direction, params=motion_params
    )
    if success == MoveResult.STALL_ERROR:
        STACKER_STATES[stacker]["stall_detected"] = True
        return success == MoveResult.STALL_ERROR
        # raise FlexStackerStallError(
        #     STACKER_STATES[stacker]["device_info"]["serial"], axis
        # )
    return success == MoveResult.NO_ERROR

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
    for axis, config in STALLGUARD_CONFIG.items():
        await stacker.set_stallguard_threshold(
            axis, config.enabled, config.threshold
        )
    return stacker

async def main(args: argparse.Namespace, gauge: bool, test_axis: str) -> None:
    """Main function."""
    if test_axis == 'X':
        axis_str = 'X'
        sw_axis = 'XE'
        TOTAL_TRAVEL = 194
    elif test_axis == 'Z':
        axis_str = 'Z'
        sw_axis = 'ZE'
        TOTAL_TRAVEL = 139.5
    elif test_axis == 'L':
        axis_str = 'L'
        sw_axis = 'LR'
        TOTAL_TRAVEL = 22
    else:
        raise("NO AXIS CHOSEN!!!")
    print(f'Building hw api')
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=False, use_defaults=True
    )
    for module in api.attached_modules:
        await module._poller.stop()
    s = await stacker_setup()
    await s.home_axis(StackerAxis.X, Direction.RETRACT)
    await s.home_axis(StackerAxis.Z, Direction.RETRACT)

    if test_axis == StackerAxis.L:
        await close_latch(s)
        await open_latch(s)

    directory = f'/data/homing_repeatability_test_{datetime.now().strftime("%m_%d_%y")}'
    if not os.path.exists(directory):
        os.makedirs(directory)
    folder_name = "homing_repeatability_"
    f_name = f'{directory}/{folder_name}{axis_str}_{datetime.now().strftime("%m_%d_%y_%H_%M")}.csv'
    with open(f_name, 'w', newline='') as f:
        writer = csv.writer(f)
        fields = ['Cycle', 
                        'Speed', 
                        'Acceleration', 
                        'Current', 
                        'Position 1', 
                        'Position 2', 
                        'Position 3']
        writer.writerow(fields)
        if test_axis == StackerAxis.L:
            direction = Direction.RETRACT
        else:
            direction = Direction.EXTEND
        for settings in list_1[axis_str]:
            for c in range(1, args.cycles+1):
                print(f'Cycle: {c}')
                print(f'Settings: {settings}')
                sw_states = await get_limit_switch_status(s)
                print(sw_states.get(test_axis, direction))
                print(STACKER_STATES)
                await move_axis(s, 
                                test_axis,
                                Direction.EXTEND,
                                TOTAL_TRAVEL - 10 # 202 -4 = 200
                                )
                if args.gauge:
                    position_1 = gauge.read_stable(10)
                    print(f'Position 1: {position_1}')
                await home_axis(s, 
                                test_axis, 
                                Direction.EXTEND, 
                                settings['SPEED'], 
                                settings['ACCEL'],
                                settings['MAX_SPEED_DISCONTINUITY'],
                                settings['CURRENT'])
                if args.gauge:
                    position_2 = gauge.read_stable(10)
                    print(f'Position 2: {position_2}')
                    data = [c, settings['SPEED'], settings['ACCEL'], settings['CURRENT'], settings['MAX_SPEED_DISCONTINUITY'], position_1, position_2]
                    writer.writerow(data)
                    f.flush()
                await move_axis(s,
                                test_axis,
                                Direction.RETRACT,
                                TOTAL_TRAVEL - 10 # 202 -4 = 200
                                )
                await s.home_axis(test_axis, Direction.RETRACT)
                

if __name__ == "__main__":
    arg_parser = build_arg_parser()
    args = arg_parser.parse_args()
    # Only needed for X axis and Z Axis
    print('Starting up')
    if args.gauge == True:
        gauge = dial_indicator.Mitutoyo_Digimatic_Indicator('/dev/ttyUSB1')
        gauge.connect()
        print("Dial gauge connected")
        home_reading = gauge.read_stable()
        print("Dial gauge Connected")
    else:
        gauge = None
    if args.axis == 'X':
        test_axis = StackerAxis.X
    elif args.axis == 'Z':
        test_axis = StackerAxis.Z
    elif args.axis == 'L':
        test_axis = StackerAxis.L
    else:
        raise("NO AXIS CHOSEN!!!")
    print('Im here')
    list_1 = make_test_list(test_axis)
    print(list_1)
    title_time = time.time()
    asyncio.run(main(args, gauge, test_axis))
