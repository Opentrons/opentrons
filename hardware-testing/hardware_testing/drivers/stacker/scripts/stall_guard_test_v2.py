import asyncio
import csv
import os
import time
import argparse
import logging
from typing import Dict, Any
from logging.config import dictConfig

from serial.tools.list_ports import comports # type: ignore
from hardware_testing.drivers import mark10
from opentrons.hardware_control.ot3api import OT3API # type: ignore
from hardware_testing.opentrons_api import helpers_ot3
from opentrons.drivers.flex_stacker.types import ( # type: ignore
    StackerAxis,
    Direction,
)
from opentrons_shared_data.errors.exceptions import FlexStackerStallError

# from opentrons.drivers.asyncio.communication.errors import MotorStall # type: ignore
from opentrons.drivers.flex_stacker.types import MoveResult # type: ignore

from opentrons.drivers.flex_stacker.driver import ( # type: ignore
    STACKER_MOTION_CONFIG,
    STALLGUARD_CONFIG,
)

# logger = logging.getLogger(__name__)

# LOG_CONFIG = {
#     "version": 1,
#     "disable_existing_loggers": False,
#     "formatters": {
#         "basic": {"format": "%(asctime)s %(name)s %(levelname)s %(message)s"}
#     },
#     "handlers": {
#         "file_handler": {
#             "class": "logging.handlers.RotatingFileHandler",
#             "formatter": "basic",
#             "filename": "/data/stallguard/stallguard_test.log",
#             "maxBytes": 5000000,
#             "level": logging.INFO,
#             "backupCount": 3,
#         },
#     },
#     "loggers": {
#         "": {
#             "handlers": ["file_handler"],
#             "level": logging.INFO,
#         },
#     },
# }

class TimerError(Exception):
    """A custom exception used to report errors in use of Timer class"""
    pass

class Timer:
    def __init__(self):
        self._start_time = None
        self._elapsed_time = None

    def start(self):
        """Start a new timer"""
        self._start_time = time.perf_counter()

    def elapsed_time(self):
        """report the elapsed time"""
        self._elapsed_time = time.perf_counter() - self._start_time
        return self._elapsed_time

    def stop_time(self):
        """Stop the timer, and report the elapsed time"""
        if self._start_time is None:
            raise TimerError("Timer is not running. Use .start() to start it")
        stop_time = time.perf_counter()

async def force_func(fg_var, sg_value, trial, axis, timer, timeout):
    # Start the timer
    timer.start()
    t = timer.elapsed_time()

    # Directory to save the data
    dir = '/data/stallguard/'
    if not os.path.exists(dir):
        os.makedirs(dir)

    # Get speed and current from configuration 
    # speed = STACKER_MOTION_CONFIG[axis]['move'].max_speed
    # current = STACKER_MOTION_CONFIG[axis]['move'].current
    # print(speed)
    # print(current)
    # Create the file name based on parameters
    file_name = f'{axis}_SG_val_{sg_value}.csv'
    print(f"File Name: {file_name}")
    # Open the file and write the data
    with open(dir + file_name, 'a', newline = '') as file:
        writer = csv.writer(file)
        # Write the header if it's the first trial
        if trial == 1:
            fields = ["Time(s)", "Force(N)", "SG Value", "Trials"]
            writer.writerow(fields)
        force_readings = []
        # Collect data until timeout
        while t < timeout:
            t = timer.elapsed_time()
            fg_reading = await fg_var.read_force()
            data = [t, fg_reading, sg_value, trial]
            force_readings.append(fg_reading)
            writer.writerow(data)
            print(data)
            # Flush the file to ensure data is written
            file.flush()
        max_force = max(force_readings)
        print(f"Trial: {trial}, SG: {sg_value}, Max Force: {max_force}")
        # log.debug(f"Trial: {trial}, SG: {sg_value}, Max Force: {max_force}")
        # Close the file
        file.close()

async def move(s: Any, axis: StackerAxis, direction: Direction, distance: float) -> Any:
    """Move the stacker axis in the specified direction and distance"""
    try:
        print('Stacker Moving')
        # Move the stacker axis
        resp = await s.move_axis(axis = axis,
                                direction = direction, 
                                distance = distance)
        print(f'Move Result: {resp}')
        print(f'Finished')
        return resp
    except Exception as e:
        print(f"Error in move: {e}")
        return e
    except FlexStackerStallError as e:
        print(f"Motor Stall detected: {e}")
        return 'Motor Stall detected'
    
def get_axis_mapping() -> Dict[str, Any]:
    return {
        'x': {'total_travel': 202, 'axis': StackerAxis.X},
        'z': {'total_travel': 202, 'axis': StackerAxis.Z},
        'l': {'total_travel': 30, 'axis': StackerAxis.L},
    }

async def main(args) -> None:
    t = Timer()
    # dictConfig(LOG_CONFIG)
    axis_mapping = {
                    'x': {'total_travel': 202, 'axis': StackerAxis.X},
                    'z': {'total_travel': 202, 'axis': StackerAxis.Z},
                    'l': {'total_travel': 30, 'axis': StackerAxis.L},
                    }
    if args.axis.lower() in axis_mapping:
        config = axis_mapping[args.axis.lower()]
        TOTAL_TRAVEL = config['total_travel']
        test_axis = config['axis']
    else:
        raise ValueError("Axis not recognized from args options")  # More specific exception
    print(f'config: {STACKER_MOTION_CONFIG}')
    # logger.info(f'config: {STACKER_MOTION_CONFIG}')
    sg_start = args.intial_sg_value
    sg_final = args.final_sg_value
    timeout = 10
    # api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating = False)
    api = await OT3API.build_hardware_controller(loop=asyncio.get_running_loop())
    if args.gauge:
        force_gauge = await mark10.Mark10.create('/dev/ttyUSB1', 115200, loop=asyncio.get_running_loop())
        print(f"Force Gauge: {force_gauge}")
    print(f"Stackers: {api.attached_modules} \n")
    # logger.info(f"Stackers: {api.attached_modules} \n")
    if not api.attached_modules:
        # logger.error("No stackers attached")
        return
    # stacker_choice = int(input("Enter Stacker Number: "))
    stacker_choice = 0
    stacker = api.attached_modules[stacker_choice]
    device_info = api.attached_modules[0].device_info
    print(f"device_info: {device_info}")
    test_functions = {
                    "move_sg_test": lambda: move(stacker, test_axis, Direction.EXTEND, TOTAL_TRAVEL),
                    "home_sg_test": lambda: stacker.home_axis(test_axis, Direction.EXTEND),
                    }
    await stacker.home_axis(StackerAxis.Z, Direction.RETRACT)
    await stacker.home_axis(StackerAxis.X, Direction.RETRACT)
    await stacker._driver.set_stallguard_threshold(test_axis, False, 4)
    await stacker.close_latch()
    await stacker.open_latch()
    sg_results = []
    stallguard_vals = [x for x in range(sg_start, sg_final+1)]
    for sg_value in stallguard_vals:
        for c in range(1, args.cycles+1):
            await stacker._driver.set_stallguard_threshold(test_axis, True, sg_value)
            if args.test in test_functions:
                move_task = asyncio.create_task(test_functions[args.test]())
            else:
                print(f"Unknown test type: {args.test}")
                return  # Or handle the unknown test case appropriately
            print(f"Cycle: {c}", "SG Value: ", sg_value)
            tasks_to_gather = [move_task]  # Start with move_task always included
            if args.gauge:
                print(f"Force Gauge: {force_gauge}")
                fg_task = asyncio.create_task(force_func(force_gauge, sg_value, c, test_axis, t, timeout))
                tasks_to_gather.append(fg_task)  # Add fg_task if force_gauge is True
            try:
                results = await asyncio.gather(*tasks_to_gather)
                print(f"StallGuard Results: {results}")
            except Exception as e:
                print(f"Motor Stall detected: {e}")
                sg_results.append((sg_value, e))
            print(f"StallGuard List: {sg_results}")
            await asyncio.sleep(1)
            await stacker._driver.set_stallguard_threshold(test_axis, False, sg_value)
            await stacker.home_axis(test_axis, Direction.RETRACT)
            await stacker._driver.set_stallguard_threshold(test_axis, True, sg_value)
        print(sg_results)

async def repeatablity_test(args) -> None:
    # dictConfig(LOG_CONFIG)
    t = Timer()
    timeout = 10
    axis_mapping = {
                    'x': {'total_travel': 202, 'axis': StackerAxis.X},
                    'z': {'total_travel': 202, 'axis': StackerAxis.Z},
                    'l': {'total_travel': 22, 'axis': StackerAxis.L},
                    }
    if args.axis.lower() in axis_mapping:
        config = axis_mapping[args.axis.lower()]
        TOTAL_TRAVEL = config['total_travel']
        test_axis = config['axis']
    else:
        raise ValueError("Axis not recognized from args options")  # More specific exception
    print(f'config: {STACKER_MOTION_CONFIG}')
    # api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating = False)
    api = await OT3API.build_hardware_controller(loop=asyncio.get_running_loop())
    force_gauge = None
    if args.gauge:
        ports = comports()
        # for port, desc, hwid in sorted(ports):
        #     print(f"{port}: {desc} [{hwid}]")
        #     if "MARK-10 USB Device - MARK-10 USB Device" == desc:
        force_gauge = await mark10.Mark10.create("/dev/ttyUSB1", 115200, loop=asyncio.get_running_loop())
            # else:
            #     print(f"Force Gauge not found on {port}")
            #     raise ValueError("Force Gauge not found")
    print(f'Force Gauge: {force_gauge}')
    stacker = api.attached_modules[0]
    device_info = api.attached_modules[0].device_info
    # sg_value = 2
    sg_value = int(input("Enter SG Value: "))
    test = input("Enter Test Type: ")
    # await stacker.home_axis(StackerAxis.X, Direction.EXTEND)
    await stacker.home_axis(StackerAxis.Z, Direction.RETRACT)
    await stacker.home_axis(StackerAxis.X, Direction.RETRACT)
    await stacker.close_latch()
    await stacker.open_latch()
    test_functions = {
                    "move_sg_test": lambda: move(stacker, test_axis, Direction.EXTEND, TOTAL_TRAVEL),
                    "home_sg_test": lambda: stacker.home_axis(test_axis, Direction.EXTEND),
                    }
    for c in range(1, args.cycles+1):
        await asyncio.sleep(1)
        await stacker._driver.set_stallguard_threshold(test_axis, False, sg_value)
        await stacker.home_axis(test_axis, Direction.RETRACT)
        await stacker._driver.set_stallguard_threshold(test_axis, True, sg_value)
        if test in test_functions:
            move_task = asyncio.create_task(test_functions[test]())
        else:
            print(f"Unknown test type: {args.test}")
            print(f"Unknown test type: {args.test}")
            return  # Or handle the unknown test case appropriately
        if args.gauge:
            print(f"Force Gauge: {force_gauge}")
            fg_task = asyncio.create_task(force_func(force_gauge, sg_value, c, test_axis, t, timeout))
        print(f"Cycle: {c}")
        try:
            if args.gauge:
                print(f"Force Gauge: {force_gauge}")
                await asyncio.gather(move_task, fg_task)
            else:
                await asyncio.gather(move_task)
        except Exception as e:
            print(f"Error in test execution: {e}")
            continue
        

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description="Motion Parameter Test Script")
    arg_parser.add_argument("-c", "--cycles", default = 100, type = int, help = "number of cycles to execute")
    arg_parser.add_argument("-a", "--axis", default = 'x', type = str, help = "Choose a Axis")
    arg_parser.add_argument("-g","--gauge", required=False, action='store_false', help = "Force gauge used")
    arg_parser.add_argument("-t", "--test", default="move_sg_test", type = str, choices=["move_sg_test","home_sg_test", "repeatability_test"])
    arg_parser.add_argument("-i", "--intial_sg_value", default = -5, type = int, help = "Initial StallGuard Value")
    arg_parser.add_argument("-f", "--final_sg_value", default = 12, type = int, help = "Final StallGuard Value")
    return arg_parser

if __name__ == '__main__':
    arg_parser = build_arg_parser()
    options = arg_parser.parse_args()
    if options.test == "move_sg_test" or options.test == "home_sg_test":
        # logger.info("Starting StallGuard Test")
        asyncio.run(main(options))
    elif options.test == "repeatability_test":
        # logger.info("Starting Repeatability Test")
        asyncio.run(repeatablity_test(options))
    else:
        # logger.error("Unknown Test Type")
        raise ValueError("Unknown Test Type")
